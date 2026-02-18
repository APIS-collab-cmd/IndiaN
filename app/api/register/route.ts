
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Mapping frontend fields to Prisma schema fields
    // Frontend uses: track, teamName, teamSize, leaderName, leaderEmail, leaderMobile, leaderCollege, leaderDegree, leaderYear
    const { 
      track, 
      teamName,
      teamSize,
      leaderName,
      leaderEmail,
      leaderMobile,
      leaderCollege,
      leaderDegree,
      leaderYear,
      
      // Members
      member2Name, member2Email, member2College, member2Degree,
      member3Name, member3Email, member3College, member3Degree,
      member4Name, member4Email, member4College, member4Degree,

      // Track 1: IdeaSprint
      ideaTitle,
      problemStatement,
      proposedSolution,
      targetUsers,
      expectedImpact,
      techStack,
      docLink,
      ideaRules, // Checkbox array (not stored directly or needs formatting)
      
      // Track 2: BuildStorm
      problemDesc,
      githubLink,
      buildRules, // Checkbox array

      // Meta
      hearAbout,
      additionalNotes
    } = body;

    if (!track || !leaderEmail) {
      return NextResponse.json({ error: 'Track and Email are required' }, { status: 400 });
    }

    // Verify OTP status (Must be verified before calling this)
    const otpRecord = await prisma.otp.findUnique({
      where: { email: leaderEmail },
    });

    if (!otpRecord || !otpRecord.verified) {
      return NextResponse.json({ error: 'Email not verified. Please verify OTP first.' }, { status: 403 });
    }

    // Check if ALREADY registered FOR THIS TRACK
    if (track === 'Track 1: IdeaSprint') {
      const existing = await prisma.ideaSprintRegistration.findUnique({
        where: { leaderEmail },
      });
      if (existing) {
        return NextResponse.json({ error: 'You have already registered for IdeaSprint.' }, { status: 409 });
      }

      await prisma.ideaSprintRegistration.create({
        data: {
          teamName,
          teamSize, // Store as string directly
          leaderName,
          leaderEmail,
          leaderPhone: leaderMobile,
          leaderCollege,
          leaderDegree,
          leaderYear,
          member2Name, member2Email, member2College, member2Degree,
          member3Name, member3Email, member3College, member3Degree,
          member4Name, member4Email, member4College, member4Degree,
          
          ideaTitle,
          problemStatement,
          proposedSolution,
          targetUsers,
          expectedImpact,
          techStack,
          psDocLink: docLink,
          
          hearAbout,
          additionalNotes
        },
      });
    } else if (track === 'Track 2: BuildStorm') {
      const existing = await prisma.buildStormRegistration.findUnique({
        where: { leaderEmail },
      });
      if (existing) {
        return NextResponse.json({ error: 'You have already registered for BuildStorm.' }, { status: 409 });
      }

      await prisma.buildStormRegistration.create({
        data: {
          teamName,
          teamSize,
          leaderName,
          leaderEmail,
          leaderPhone: leaderMobile,
          leaderCollege,
          leaderDegree,
          leaderYear,
          member2Name, member2Email, member2College, member2Degree,
          member3Name, member3Email, member3College, member3Degree,
          member4Name, member4Email, member4College, member4Degree,
          
          problemDesc,
          githubLink,
          
          hearAbout,
          additionalNotes
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid Track Selection' }, { status: 400 });
    }

    // Optional: Send confirmation email
    // ...

    return NextResponse.json({ message: 'Registration Successful!' });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
