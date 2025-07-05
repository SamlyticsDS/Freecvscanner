"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  User,
  Briefcase,
  Award,
  Target,
  Lightbulb,
  Download,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Achievement {
  role: string
  achievement: string
  keywords: string[]
}

interface AnalysisResult {
  atsScore: number
  targetScore: number
  optimizedSummary: string
  coreSkills: string[]
  personalizedAchievements: Achievement[]
  missingKeywords: string[]
  atsImprovements: string[]
  keywordDensity: { [key: string]: number }
}

export default function OptimizePage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedResult = sessionStorage.getItem("analysisResult")
    if (storedResult) {
      const result = JSON.parse(storedResult)
      setAnalysisResult(result)
    } else {
      router.push("/")
    }
  }, [router])

  const handleCopyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleDownloadAll = () => {
    if (!analysisResult) return

    const content = `
ATS-OPTIMIZED CV SECTIONS
========================

PROFESSIONAL SUMMARY:
${analysisResult.optimizedSummary}

CORE SKILLS:
${analysisResult.coreSkills.join(" • ")}

PERSONALIZED ACHIEVEMENTS:
${analysisResult.personalizedAchievements
  .map((achievement) => `${achievement.role}: ${achievement.achievement}`)
  .join("\n")}

MISSING KEYWORDS TO ADD:
${analysisResult.missingKeywords.join(", ")}

ATS IMPROVEMENTS:
${analysisResult.atsImprovements.map((improvement, index) => `${index + 1}. ${improvement}`).join("\n")}
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ats-optimized-cv-sections.txt"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading optimization results...</p>
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
            <Button
              onClick={handleDownloadAll}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
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
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Optimizer
          </Button>
          <h1 className="text-3xl font-bold text-white">
            ATS <span className="text-blue-400">Optimization</span> Results
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Current ATS Score</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analysisResult.atsScore}%</div>
              <Progress value={analysisResult.atsScore} className="mt-2" />
              <p className="text-xs text-slate-400 mt-2">
                {analysisResult.atsScore >= 80 ? "Good" : "Needs Improvement"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Target ATS Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-lime-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lime-400">{analysisResult.targetScore}%</div>
              <Progress value={analysisResult.targetScore} className="mt-2" />
              <p className="text-xs text-slate-400 mt-2">After Optimization</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Missing Keywords</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analysisResult.missingKeywords.length}</div>
              <p className="text-xs text-slate-400 mt-2">Critical keywords to add</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Professional Summary
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Core Skills
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="improvements"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              ATS Improvements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-blue-400" />
                  Optimized Professional Summary
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Copy this summary to replace your current professional summary section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                  <p className="text-white leading-relaxed">{analysisResult.optimizedSummary}</p>
                </div>
                <Button
                  onClick={() => handleCopyToClipboard(analysisResult.optimizedSummary, "summary")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedSection === "summary" ? "Copied!" : "Copy Summary"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Briefcase className="w-5 h-5 text-lime-400" />
                  Core Skills Section
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Essential skills that match the job posting keywords exactly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.coreSkills.map((skill, index) => (
                      <Badge key={index} className="bg-blue-600 text-white hover:bg-blue-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                  <p className="text-slate-300 text-sm mb-2">Formatted for CV:</p>
                  <p className="text-white">{analysisResult.coreSkills.join(" • ")}</p>
                </div>
                <Button
                  onClick={() => handleCopyToClipboard(analysisResult.coreSkills.join(" • "), "skills")}
                  className="bg-lime-600 hover:bg-lime-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedSection === "skills" ? "Copied!" : "Copy Skills"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Personalized Achievements
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Quantified achievement statements optimized for this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResult.personalizedAchievements.map((achievement, index) => (
                  <div key={index} className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{achievement.role}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(achievement.achievement, `achievement-${index}`)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiedSection === `achievement-${index}` ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <p className="text-slate-200 mb-3">{achievement.achievement}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-slate-400 mr-2">Keywords:</span>
                      {achievement.keywords.map((keyword, kidx) => (
                        <Badge key={kidx} variant="outline" className="text-xs border-slate-500 text-slate-300">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    handleCopyToClipboard(
                      analysisResult.personalizedAchievements
                        .map((achievement) => `• ${achievement.achievement}`)
                        .join("\n"),
                      "all-achievements",
                    )
                  }
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedSection === "all-achievements" ? "Copied!" : "Copy All Achievements"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improvements">
            <div className="grid gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    ATS Improvements
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Specific changes to achieve 90-100% ATS compatibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.atsImprovements.map((improvement, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg border border-slate-600"
                      >
                        <CheckCircle className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-200">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Critical Missing Keywords</CardTitle>
                  <CardDescription className="text-slate-300">
                    Add these keywords to your CV to improve ATS scanning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.missingKeywords.map((keyword, index) => (
                      <Badge key={index} variant="destructive" className="bg-red-600 text-white">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleCopyToClipboard(analysisResult.missingKeywords.join(", "), "keywords")}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedSection === "keywords" ? "Copied!" : "Copy Keywords"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Keyword Density Analysis</CardTitle>
                  <CardDescription className="text-slate-300">Current keyword frequency in your CV</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analysisResult.keywordDensity).map(([keyword, density]) => (
                      <div key={keyword} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{keyword}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(density * 20, 100)} className="w-20" />
                          <span className="text-sm text-slate-400">{density}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
