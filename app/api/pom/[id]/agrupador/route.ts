import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { agrupadorId } = await request.json();
    const updatedPOM = await prisma.pOM.update({
      where: { id: params.id },
      data: { agrupadorDePOMId: agrupadorId },
    });
    return NextResponse.json(updatedPOM);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar associação do POM' },
      { status: 500 }
    );
  }
}
