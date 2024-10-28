import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { paiId } = await request.json();
    const agrupadorId = params.id;

    // Primeiro, verifica se não está tentando criar um ciclo
    if (paiId) {
      const isDescendant = async (parentId: string, childId: string): Promise<boolean> => {
        const parent = await prisma.agrupadorDePOM.findUnique({
          where: { id: parentId },
          include: { filhos: true }
        });
        
        if (!parent) return false;
        if (parent.id === childId) return true;
        
        for (const filho of parent.filhos) {
          if (await isDescendant(filho.id, childId)) return true;
        }
        
        return false;
      };

      if (await isDescendant(agrupadorId, paiId)) {
        return NextResponse.json(
          { error: 'Não é possível criar um ciclo na hierarquia' },
          { status: 400 }
        );
      }
    }

    // Atualiza o agrupador com o novo pai
    const updatedAgrupador = await prisma.agrupadorDePOM.update({
      where: { id: agrupadorId },
      data: { 
        paiId: paiId 
      },
      include: {
        poms: {
          include: {
            elements: true
          }
        },
        filhos: {
          include: {
            poms: true,
            filhos: true
          }
        },
        pai: true
      }
    });

    return NextResponse.json(updatedAgrupador);
  } catch (error) {
    console.error('Erro ao atualizar pai do agrupador:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pai do agrupador' },
      { status: 500 }
    );
  }
}
