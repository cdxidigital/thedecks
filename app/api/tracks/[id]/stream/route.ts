import { get } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tracks } from '@/lib/db/schema'

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){ const session=await auth.api.getSession({headers:await headers()}); if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401}); const {id}=await params; const [track]=await db.select().from(tracks).where(and(eq(tracks.id,id),eq(tracks.userId,session.user.id))); if(!track)return new NextResponse('Not found',{status:404}); const result=await get(track.blobPathname,{access:'private',ifNoneMatch:request.headers.get('if-none-match')??undefined}); if(!result)return new NextResponse('Not found',{status:404}); if(result.statusCode===304)return new NextResponse(null,{status:304,headers:{ETag:result.blob.etag,'Cache-Control':'private, no-cache'}}); return new NextResponse(result.stream,{headers:{'Content-Type':track.contentType,'Content-Length':String(track.size),ETag:result.blob.etag,'Cache-Control':'private, no-cache','Accept-Ranges':'bytes'}}) }
