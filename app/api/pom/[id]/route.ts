import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const pom = await prisma.pOM.findUnique({
    where: { id },
    include: { elements: true },
  });

  if (!pom) {
    return NextResponse.json({ error: 'POM not found' }, { status: 404 });
  }

  return NextResponse.json(pom);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await request.json();

  try {
    const updatedPOM = await prisma.pOM.update({
      where: { id },
      data: {
        name: body.name,
        screenshotUrl: body.screenshotUrl,
        htmlContent: body.htmlContent,
        elements: {
          deleteMany: {},
          create: body.elements.map((element: any) => ({
            type: element.type,
            name: element.name,
            locator: element.locator,
            value: element.value,
            coordinates: element.coordinates,
            action: element.action,
            isRequired: element.isRequired,
          })),
        },
      },
      include: { elements: true },
    });

    return NextResponse.json(updatedPOM);
  } catch (error) {
    console.error('Error updating POM:', error);
    return NextResponse.json({ error: 'Failed to update POM' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    await prisma.pOM.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'POM deleted successfully' });
  } catch (error) {
    console.error('Error deleting POM:', error);
    return NextResponse.json({ error: 'Failed to delete POM' }, { status: 500 });
  }
}
