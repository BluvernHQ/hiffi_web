/**
 * Utility functions for video processing and thumbnail extraction
 */

/**
 * Extracts a thumbnail frame from a video file
 * @param videoFile - The video file to extract frame from
 * @param timeOffset - Time in seconds to extract frame (default: 1 second or 10% of duration)
 * @returns Promise resolving to a Blob containing the thumbnail image
 */
export async function extractVideoThumbnail(
  videoFile: File,
  timeOffset?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const videoUrl = URL.createObjectURL(videoFile)
    video.src = videoUrl

    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Calculate time offset (default to 1 second or 10% of duration, whichever is smaller)
      const duration = video.duration
      const offset = timeOffset ?? Math.min(1, duration * 0.1)

      video.currentTime = offset
    }

    video.onseeked = () => {
      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            // Clean up
            URL.revokeObjectURL(videoUrl)
            video.remove()
            canvas.remove()
            
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create thumbnail blob'))
            }
          },
          'image/jpeg',
          0.92 // Quality (0-1)
        )
      } catch (error) {
        URL.revokeObjectURL(videoUrl)
        video.remove()
        canvas.remove()
        reject(error)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
      canvas.remove()
      reject(new Error('Video loading error'))
    }
  })
}

/**
 * Extracts multiple thumbnail frames from a video at different time points
 * @param videoFile - The video file to extract frames from
 * @param count - Number of frames to extract (default: 3)
 * @returns Promise resolving to an array of Blobs containing thumbnail images
 */
export async function extractMultipleVideoThumbnails(
  videoFile: File,
  count: number = 3
): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const thumbnails: Blob[] = []
    let currentFrame = 0
    const videoUrl = URL.createObjectURL(videoFile)
    video.src = videoUrl

    const extractFrame = (frameIndex: number) => {
      if (frameIndex >= count) {
        URL.revokeObjectURL(videoUrl)
        video.remove()
        canvas.remove()
        resolve(thumbnails)
        return
      }

      const duration = video.duration
      const interval = duration / (count + 1) // Distribute frames evenly
      const timeOffset = interval * (frameIndex + 1)
      video.currentTime = timeOffset
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      extractFrame(0)
    }

    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              thumbnails.push(blob)
              currentFrame++
              extractFrame(currentFrame)
            } else {
              URL.revokeObjectURL(videoUrl)
              video.remove()
              canvas.remove()
              reject(new Error('Failed to create thumbnail blob'))
            }
          },
          'image/jpeg',
          0.92
        )
      } catch (error) {
        URL.revokeObjectURL(videoUrl)
        video.remove()
        canvas.remove()
        reject(error)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
      canvas.remove()
      reject(new Error('Video loading error'))
    }
  })
}

/**
 * Converts a Blob to a File object
 * @param blob - The blob to convert
 * @param filename - The filename for the file
 * @returns File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

