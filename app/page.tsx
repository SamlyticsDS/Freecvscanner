"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Target,
  CheckCircle,
  Key,
  AlertCircle,
  ExternalLink,
  Copy,
  Award,
  User,
  Briefcase,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Client-side Groq API integration
const makeGroqRequest = async (apiKey: string, prompt: string, maxTokens = 1500) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "API request failed")
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

// JSON extraction + repair helper
const safeJsonParse = (raw: string) => {
  // Remove Markdown fences like ```json
  let src = raw.replace(/```(?:json)?/gi, "").trim()
  const first = src.indexOf("{")
  const last = src.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found")
  }
  src = src.slice(first, last + 1)

  // Escape newline chars *inside* double-quoted string literals only
  let out = ""
  let inString = false
  let prev = ""
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === '"' && prev !== "\\") {
      inString = !inString
    }
    if (inString && (ch === "\n" || ch === "\r")) {
      out += "\\n"
    } else {
      out += ch
    }
    prev = ch
  }

  return JSON.parse(out)
}

// File reading helper
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

// Text truncation helper
const truncate = (txt: string, max: number) => (txt ?? "").replace(/\s+/g, " ").trim().slice(0, max)

export default function HomePage() {
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [experienceSummary, setExperienceSummary] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showApiKeySetup, setShowApiKeySetup] = useState(true)
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState(false)
  const [showUrlInstructions, setShowUrlInstructions] = useState(false)
  const [validationError, setValidationError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const storedKey = localStorage.getItem("groq_api_key")
    if (storedKey) {
      setApiKey(storedKey)
      setApiKeyValid(true)
      setShowApiKeySetup(false)
    }
  }, [])

  const handleApiKeySubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!apiKey.trim()) {
      setValidationError("Please enter your Groq API key")
      return
    }

    setIsValidatingKey(true)
    setValidationError("")

    try {
      // Test the API key with a simple request
      await makeGroqRequest(apiKey.trim(), "Hello", 5)

      setApiKeyValid(true)
      setShowApiKeySetup(false)
      localStorage.setItem("groq_api_key", apiKey.trim())
    } catch (error: any) {
      console.error("API key validation failed:", error)
      setValidationError(`Invalid API key: ${error.message || "Please check your Groq API key and try again."}`)
    } finally {
      setIsValidatingKey(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === "application/pdf" || file.type.includes("document") || file.type === "text/plain")) {
      setCvFile(file)
    }
  }

  const handleOpenJobUrl = () => {
    if (jobUrl) {
      window.open(jobUrl, "_blank")
      setShowUrlInstructions(true)
    }
  }

  const copyInstructions = `
How to extract job description from the URL:

1. Click "Open Job URL" to visit the job posting
2. On the job posting page, select all the job description text
3. Copy the text (Ctrl+C or Cmd+C)
4. Come back to this tab
5. Paste the job description in the "Job Description" tab below

This workaround is needed because GitHub Pages cannot directly fetch content from external websites due to CORS restrictions.
`

  const handleCopyInstructions = () => {
    navigator.clipboard.writeText(copyInstructions)
    alert("Instructions copied to clipboard!")
  }

  const handleAnalyze = async () => {
    if (!cvFile || !jobDescription || !experienceSummary) {
      alert("Please fill in all required fields. Note: You need to paste the job description manually.")
      return
    }

    if (!apiKey) {
      alert("Please configure your API key first")
      return
    }

    setIsLoading(true)

    try {
      // Read CV file
      const cvText = truncate(await readFileAsText(cvFile), 6000)
      const expText = truncate(experienceSummary, 1000)
      const jdText = truncate(jobDescription, 3000)

      // Create enhanced prompt for section-specific optimization
      const prompt = `
You are an expert ATS optimization specialist. Analyze the candidate's CV against the job description and provide targeted improvements to achieve 90-100% ATS compatibility.

Return STRICT JSON matching exactly this shape (no markdown, no extras):

{
  "atsScore": <current score 0-100>,
  "targetScore": <projected score after improvements 90-100>,
  "optimizedSummary": "<2-3 sentence professional summary optimized for this role>",
  "coreSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "personalizedAchievements": [
    {
      "role": "Job Title",
      "achievement": "Quantified achievement statement with metrics",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "missingKeywords": ["critical keyword1", "critical keyword2"],
  "atsImprovements": [
    "Specific improvement 1",
    "Specific improvement 2"
  ],
  "keywordDensity": {
    "important_skill": 2.5,
    "another_skill": 1.8
  }
}

Focus on:
1. Professional summary that mirrors job requirements
2. 5 core skills that match job posting exactly
3. 3-5 achievement statements with quantified results
4. Critical missing keywords for ATS scanning
5. Specific improvements to reach 90%+ ATS score

--- INPUTS ---

Current CV:
${cvText}

Experience Summary:
${expText}

Target Job Description:
${jdText}
`

      // Make API request
      const response = await makeGroqRequest(apiKey, prompt, 1800)

      // Parse response
      const result = safeJsonParse(response)

      // Store result and navigate
      sessionStorage.setItem("analysisResult", JSON.stringify(result))
      router.push("/optimize")
    } catch (error: any) {
      console.error("Error:", error)
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (showApiKeySetup || !apiKeyValid) {
    return (
      <div className="min-h-screen bg-slate-900 relative">
        {/* Background pattern similar to Samlytics */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>

        {/* Navigation */}
        <div className="relative z-10 container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/samlytics-logo.png" alt="Samlytics Logo" width={32} height={32} className="rounded-lg" />
              <span className="text-white font-semibold">Samlytics</span>
              <span className="text-blue-400">CV Optimizer</span>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open("https://samlytics.co.uk", "_blank")}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Samlytics
            </Button>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
          <Card className="w-full max-w-2xl bg-slate-800/90 border-slate-700 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">API Key Setup Required</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                To use the CV Optimizer, you need to provide your Groq API key for AI processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Alert className="bg-blue-900/30 border-blue-700/50 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-slate-200">
                  This application uses Groq's free AI models to analyze and optimize your CV. You'll need a free Groq
                  API key to continue.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm text-white">
                      1
                    </span>
                    How to get your Groq API key:
                  </h3>
                  <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300 ml-8">
                    <li>
                      Visit{" "}
                      <a
                        href="https://console.groq.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline font-medium"
                      >
                        console.groq.com
                      </a>
                    </li>
                    <li>Sign up for a free account or log in</li>
                    <li>Navigate to the API Keys section</li>
                    <li>Create a new API key</li>
                    <li>Copy the API key and paste it below</li>
                  </ol>
                </div>

                <form onSubmit={handleApiKeySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-white font-medium">
                      Groq API Key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="gsk_..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setValidationError("")
                      }}
                      className="bg-slate-700/70 border-slate-600 text-white placeholder:text-slate-400 h-12 text-base"
                      disabled={isValidatingKey}
                    />
                    {validationError && <p className="text-red-400 text-sm mt-2">{validationError}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-12 text-base"
                    disabled={isValidatingKey || !apiKey.trim()}
                  >
                    {isValidatingKey ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Validating...
                      </>
                    ) : (
                      "Validate & Continue"
                    )}
                  </Button>
                </form>
              </div>

              <Alert className="bg-slate-700/30 border-slate-600">
                <AlertDescription className="text-xs text-slate-300">
                  <strong>Privacy Note:</strong> Your API key is stored locally in your browser and is used solely to
                  make requests to Groq's API. It is not sent to any other servers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/samlytics-logo.png" alt="Samlytics Logo" width={32} height={32} className="rounded-lg" />
            <span className="text-white font-semibold">Samlytics</span>
            <span className="text-blue-400">CV Optimizer</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-lime-400" />
              <span className="text-sm text-lime-400">API Connected</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeySetup(true)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Change API Key
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("https://samlytics.co.uk", "_blank")}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Samlytics
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-white">ATS </span>
            <span className="text-blue-400">CV</span>
            <span className="text-lime-400"> Optimizer</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-6">
            Get personalized CV sections optimized for 90-100% ATS compatibility. Receive targeted improvements for your
            summary, skills, and achievements.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <User className="w-12 h-12 mx-auto text-blue-400 mb-2" />
              <CardTitle className="text-white">Professional Summary</CardTitle>
              <CardDescription className="text-slate-300">
                AI-crafted summary tailored to job requirements
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <Briefcase className="w-12 h-12 mx-auto text-lime-400 mb-2" />
              <CardTitle className="text-white">Core Skills</CardTitle>
              <CardDescription className="text-slate-300">
                Essential skills matching job posting keywords
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <Award className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
              <CardTitle className="text-white">Achievements</CardTitle>
              <CardDescription className="text-slate-300">
                Quantified accomplishments with impact metrics
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-4xl mx-auto bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-6 h-6 text-blue-400" />
              ATS Optimization Tool
            </CardTitle>
            <CardDescription className="text-slate-300">
              Upload your CV and job description to get section-specific optimizations for maximum ATS compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cv-upload" className="text-white">
                Upload Your CV *
              </Label>
              <Input
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="cursor-pointer bg-slate-700 border-slate-600 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
              />
              {cvFile && (
                <p className="text-sm text-lime-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {cvFile.name} uploaded successfully
                </p>
              )}
              <p className="text-xs text-slate-400">
                Note: For best results with GitHub Pages deployment, please use plain text (.txt) files
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience" className="text-white">
                Experience Summary *
              </Label>
              <Textarea
                id="experience"
                placeholder="Briefly describe your professional background, key skills, and career highlights..."
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                rows={4}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger
                  value="url"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Job URL
                </TabsTrigger>
                <TabsTrigger
                  value="description"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Job Description
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-url" className="text-white">
                    Job Posting URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="job-url"
                      type="url"
                      placeholder="https://example.com/job-posting"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenJobUrl}
                      disabled={!jobUrl}
                      className="flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Job URL
                    </Button>
                  </div>
                </div>

                {showUrlInstructions && (
                  <Alert className="bg-slate-700 border-slate-600">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-slate-200">
                      <div className="space-y-2">
                        <p className="font-medium">Manual Copy Required:</p>
                        <p className="text-sm">
                          Since this is a static site, you need to manually copy the job description from the opened
                          page and paste it in the "Job Description" tab.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyInstructions}
                          className="flex items-center gap-2 mt-2 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Instructions
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-slate-700 border-slate-600">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-slate-200">
                    <strong>GitHub Pages Limitation:</strong> Direct URL fetching is not available due to CORS
                    restrictions. Use the "Open Job URL" button to visit the job posting, then manually copy and paste
                    the job description in the "Job Description" tab.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="description" className="space-y-2">
                <Label htmlFor="job-desc" className="text-white">
                  Job Description *
                </Label>
                <Textarea
                  id="job-desc"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-sm text-slate-400">
                  Copy and paste the complete job description. If you have a job URL, use the "Job URL" tab to open it
                  first.
                </p>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-blue-600 to-lime-500 hover:from-blue-700 hover:to-lime-600 text-white font-semibold"
              size="lg"
              disabled={isLoading || !cvFile || !experienceSummary || !jobDescription}
            >
              {isLoading ? "Analyzing & Optimizing..." : "Get ATS-Optimized Sections"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
