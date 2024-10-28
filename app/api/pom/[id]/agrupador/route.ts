import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { agrupadorId } = await request.json();
    const pomId = params.id;

    const updatedPom = await prisma.pOM.update({
      where: { id: pomId },
      data: { 
        agrupadorDePOMId: agrupadorId 
      },
      include: {
        elements: true,
        agrupadorDePOM: true
      }
    });

    return NextResponse.json(updatedPom);
  } catch (error) {
    console.error('Erro ao atualizar POM:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar POM' },
      { status: 500 }
    );
  }
}
