import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, elements, screenshotUrl, htmlContent } = body;

    const pom = await prisma.pOM.create({
      data: {
        name,
        screenshotUrl,
        htmlContent,
        elements: {
          create: elements.map((element: any) => ({
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
      include: {
        elements: true,
      },
    });

    return NextResponse.json(pom);
  } catch (error) {
    console.error('Error saving POM:', error);
    return NextResponse.json({ error: 'Error saving POM' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const poms = await prisma.pOM.findMany({
      include: {
        elements: true,
      },
    });
    return NextResponse.json(poms);
  } catch (error) {
    console.error('Error fetching POMs:', error);
    return NextResponse.json({ error: 'Error fetching POMs' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, elements, screenshotUrl, htmlContent } = body;

    const updatedPOM = await prisma.pOM.update({
      where: { id },
      data: {
        name,
        screenshotUrl,
        htmlContent,
        elements: {
          deleteMany: {},
          create: elements.map((element: any) => ({
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
      include: {
        elements: true,
      },
    });

    return NextResponse.json(updatedPOM);
  } catch (error) {
    console.error('Error updating POM:', error);
    return NextResponse.json({ error: 'Error updating POM' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'POM ID is required' }, { status: 400 });
    }

    await prisma.pOM.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'POM deleted successfully' });
  } catch (error) {
    console.error('Error deleting POM:', error);
    return NextResponse.json({ error: 'Error deleting POM' }, { status: 500 });
  }
}
