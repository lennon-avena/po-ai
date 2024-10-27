import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const pom = await prisma.pOM.findUnique({
      where: { id },
      include: {
        elements: true,
        agrupadorDePOM: true,
      },
    });

    if (!pom) {
      return NextResponse.json(
        { error: 'POM not found' }, 
        { status: 404 }
      );
    }

    // Garantir que elements seja sempre um array
    const pomWithElements = {
      ...pom,
      elements: pom.elements || [],
    };

    return NextResponse.json(pomWithElements);
  } catch (error) {
    console.error('Error fetching POM:', error);
    return NextResponse.json(
      { error: 'Failed to fetch POM' }, 
      { status: 500 }
    );
  }
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
        elements: body.elements ? {
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
        } : undefined,
      },
      include: {
        elements: true,
        agrupadorDePOM: true,
      },
    });

    return NextResponse.json(updatedPOM);
  } catch (error) {
    console.error('Error updating POM:', error);
    return NextResponse.json(
      { error: 'Failed to update POM', details: error }, 
      { status: 500 }
    );
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const atualizadoPOM = await prisma.pOM.update({
      where: { id: params.id },
      data: {
        agrupadorDePOMId: data.agrupadorDePOMId,
      },
      include: {
        elements: true,
        agrupadorDePOM: true,
      },
    });
    return NextResponse.json(atualizadoPOM);
  } catch (error) {
    console.error('Erro ao atualizar POM:', error);
    return NextResponse.json({ error: 'Erro ao atualizar POM' }, { status: 500 });
  }
}
