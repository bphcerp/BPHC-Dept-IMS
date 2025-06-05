"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import api from "@/lib/axios-instance"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { BASE_API_URL } from "@/lib/constants"
import { Upload, X, User, FileImage, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileProps {
  userName: string
  userEmail: string
}

const Profile: React.FC<ProfileProps> = ({ userName, userEmail }) => {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const res = await api.get("/profile/signature", {
          params: { email: userEmail },
        })

        const fileId = res.data?.signature?.id
        if (fileId) {
          setSignatureUrl(`${BASE_API_URL}f/${fileId}`)
        }
      } catch (error) {
        console.error("Failed to fetch signature:", error)
        toast.error("Could not load signature")
      } finally {
        setLoading(false)
      }
    }

    fetchSignature()
  }, [userEmail])

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return false
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image must be less than 1MB")
      return false
    }

    return true
  }

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return

    const formData = new FormData()
    formData.append("signature", file)
    formData.append("email", userEmail)

    setUploading(true)
    try {
      const res = await api.post("/profile/signature", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const fileId = res.data?.fileId
      if (fileId) {
        setSignatureUrl(`${BASE_API_URL}f/${fileId}`)
        toast.success("Signature uploaded successfully")
      }
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Failed to upload signature")
    } finally {
      setUploading(false)
      if (inputFileRef.current) inputFileRef.current.value = ""
    }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const onRemoveSignature = async () => {
    setUploading(true)
    try {
      await api.delete("/profile/signature", {
        data: { email: userEmail },
      })
      setSignatureUrl(null)
      toast.success("Signature removed successfully")
    } catch (error) {
      console.error("Remove failed:", error)
      toast.error("Failed to remove signature")
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const SignatureSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-24 w-48 bg-gray-200 rounded-lg"></div>
    </div>
  )

  return (
    <div className="max-w-2xl ml-6 p-6 space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900"> {userName || "User"}</CardTitle>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Digital Signature
          </CardTitle>
          <p className="text-sm text-gray-600">Upload your digital signature for document signing</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <SignatureSkeleton />
          ) : signatureUrl ? (
            <div className="space-y-4">
              <div>
                <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50 inline-block">
                  <img
                    src={signatureUrl || "/placeholder.svg"}
                    alt="Digital Signature"
                    className="max-h-24 max-w-full object-contain"
                    onError={() => {
                      console.error("Image failed to load:", signatureUrl)
                      toast.error("Failed to load signature image")
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => inputFileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Replace Signature
                </Button>
                <Button
                  variant="destructive"
                  onClick={onRemoveSignature}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                uploading && "opacity-50 pointer-events-none",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-600" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Upload your signature</h3>
                  <p className="text-sm text-gray-600">Drag and drop your signature image here, or click to browse</p>
                  <p className="text-xs text-gray-500">Supports: PNG, JPG, JPEG (max 1MB)</p>
                </div>

                <Button onClick={() => inputFileRef.current?.click()} disabled={uploading} className="mt-4">
                  {uploading ? "Uploading..." : "Choose File"}
                </Button>
              </div>
            </div>
          )}

          <input type="file" accept="image/*" onChange={onFileChange} ref={inputFileRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
