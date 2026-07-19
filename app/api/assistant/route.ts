import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(request:Request){ const session=await auth.api.getSession({headers:await headers()}); if(!session?.user)return NextResponse.json({error:'Unauthorized'},{status:401}); const {prompt,tracks}=await request.json(); if(typeof prompt!=='string'||prompt.length>1000)return NextResponse.json({error:'Invalid prompt'},{status:400}); const library=Array.isArray(tracks)?tracks.slice(0,50).map(t=>`${t.title} — ${t.artist}, ${t.bpm||'?'} BPM, ${t.musicalKey||'?'} key`).join('\n'):''; const {text}=await generateText({model:google('gemini-2.5-flash'),system:'You are the concise performance assistant for the decks by 4{music}2. Recommend only tracks present in the supplied user library. Never invent availability. Give practical DJ transition advice in 3 short sentences or fewer.',prompt:`User library:\n${library||'No tracks loaded'}\n\nRequest: ${prompt}`}); return NextResponse.json({text}) }
