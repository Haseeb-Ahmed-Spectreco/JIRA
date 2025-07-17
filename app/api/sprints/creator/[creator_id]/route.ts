import { type NextRequest, NextResponse } from 'next/server';
import { PrismaClient,  } from '@prisma/client';

const prisma = new PrismaClient();


export async function GET(
    req: NextRequest,
    { params }: { params: { creator_id: string } }
) {
    const { creator_id } = params;
    

    console.log("Creator Id : ", creator_id)

    if (creator_id) {
    const sprints = await prisma.sprint.findFirst({
        where: {
            status: "ACTIVE",
            name: creator_id
        },
    });
        return NextResponse.json({ sprints });

}
else {
    return NextResponse.json({})
}

}

