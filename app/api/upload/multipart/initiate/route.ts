import { NextResponse } from 'next/server'
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3'
import { r2Client } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const supabase = await createClient(req)
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) {
      const authHeader = req.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim()
        const { data: headerUser } = await supabase.auth.getUser(token)
        if (headerUser?.user) user = headerUser.user
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, contentType } = await req.json()
    
    // Generate a secure, unique key
    const uniqueId = crypto.randomUUID()
    const key = `uploads/${user.id}/${uniqueId}-${filename}`
    const bucket = process.env.R2_BUCKET_SOURCES || 'prometheus-sources'

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
      Metadata: {
        'user-id': user.id,
        'original-filename': filename
      }
    })

    const response = await r2Client.send(command)

    return NextResponse.json({
      uploadId: response.UploadId,
      key: response.Key,
    })
  } catch (error: any) {
    console.error('[Multipart Initiate Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
