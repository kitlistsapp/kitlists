import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'noreply@kitlists.app',
      to: 'crewflowapps@gmail.com',
      subject: 'KitLists Resend Test',
      html: '<p>Resend is working!</p>'
    })
  })
  const data = await res.json()
  return NextResponse.json(data)
}
