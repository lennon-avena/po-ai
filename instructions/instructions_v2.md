<PRD>  
# PRD - Melhorias na Aplicação Web: Adição de Grupo de POM    
  
## Visão Geral    
  
Este documento detalha as melhorias a serem implementadas na aplicação web, incluindo a adição de uma funcionalidade para "Adicionar novo grupo de POM". O objetivo é permitir aos usuários criar agrupadores de POMs, oferecendo uma interface intuitiva e garantindo que a persistência de dados funcione conforme novas regras e a adição do componente "Drag and Drop".  
   
## Objetivos da Melhoria    
  
1. **Adicionar a funcionalidade de agrupar POMs** para melhor organização e visualização.    
2. **Permitir movimentação intuitiva** de "Agrupadores de POMs" e "POMs" através de um novo componente "Drag and Drop".    
3. **Persistir a estrutura de dados no banco** com total respeito às novas regras de hierarquia.    
4. **Aprimorar a experiência do usuário** com um design minimalista para os agrupadores e um comportamento responsivo na interação.    
  
## Funcionalidades Requeridas    
  
### 1. Opção "Adicionar Novo Grupo de POM"    
- **Localização na Tela**: O botão deve ser posicionado ao lado do ícone “Adicionar novo POM” no topo da “Lista de POMs”.    
- **Ícone**: Usar um ícone de "double plus" para representar a adição de grupos.    
- **Comportamento**:     
  - O botão deve ter o mesmo comportamento que o ícone "Adicionar novo POM".    
  - Após concluir a inclusão, um novo “Agrupador de POMs” deve ser criado no estilo Accordion.    
  
### 2. Agrupador de POMs - Persistência em Banco de Dados    
- Criar uma nova tabela para persistir os agrupadores de POMs.    
- **Regras de Persistência (Tipo Árvore)**:    
  - Um "Agrupador de POMs" poderá estar associado a "0" ou "N" POMs do tipo "Filho".    
  - Um "Agrupador de POMs" poderá estar associado a "0" ou "N" "Agrupadores de POMs" do tipo "Filhos".    
  - Um "Agrupador de POMs" poderá estar associado a "0" ou "1" "Agrupador de POMs" do tipo "Pai".    
  - Um "POM" poderá estar associado a "0" ou "1" "Agrupador de POMs" do tipo "Pai".    
  
### 3. Agrupador de POMs - Estilo    
- O estilo visual dos agrupadores deve ser diferente e mais minimalista em comparação com os POMs.    
  
### 4. Comportamento do Agrupador de POMs na Lista de POMs    
- Permitir aos usuários arrastar um ou mais agrupadores para dentro de outro agrupador.    
- Permitir aos usuários arrastar um ou mais POMs para dentro de um agrupador.    
- **Persistência de Ordenação Visual**: A ordenação e as associações entre agrupadores e POMs devem ser salvas no banco de dados para serem recuperadas corretamente na consulta.    
  
### 5. Criação do Componente "Drag and Drop"    
- **Descrição**: Implementar um novo componente que permita arrastar e soltar itens na árvore de agrupadores e POMs.    
- **Funcionamento**:   
  - O componente deve responder a eventos de arrastar e soltar para mover POMs e agrupadores entre diferentes níveis da hierarquia.    
  - O movimento deve ser refletido visualmente durante a operação de arrastar, permitindo ao usuário ver onde o item será solto.    
  - As operações de "Drag and Drop" devem ser seguras para impedir que um agrupador se torne filho de um filho (ou seja, evitar ciclos).    
  
## Atualizações Necessárias    
  
### 1. Atualização de Código    
- **Adicionar novo botão** na interface de usuário com ícone e comportamento definido.    
- **Implementar interação de drag-and-drop** para permitir a movimentação de agrupadores e POMs.    
- **Atualizar componentes visuais** da interface para incluir os novos estilos minimalistas.    
- **Desenvolver o componente Drag and Drop** que integre a funcionalidade de movimentação com feedback visual.    
  
### 2. Atualização do Banco de Dados    
- Criar uma nova tabela para “Agrupador de POMs”.    
- Modificar a tabela existente de "POMs" para incluir novas colunas de referência para os campos “Pai” e “Filho”.    
  
### 3. Atualização do ORM Prisma    
- Adicionar uma nova definição de modelo para os agrupadores de POMs no arquivo `prisma/schema.prisma`:    
  - Nova tabela para `AgrupadorDePOM`.    
  - Relacionamentos para permitir a hierarquia e as associações conforme descrito nas regras.    
      
  Exemplo de como poderia ser:    
  ```prisma    
  model AgrupadorDePOM {    
    id        Int       @id @default(autoincrement())    
    nome      String    
    paiId     Int?     @relation("AgrupadorPai", fields: [paiId], references: [id])    
    filhos    AgrupadorDePOM[] @relation("AgrupadorPai")    
    poms      POM[]    
  }    
    
  model POM {    
    id                 Int            @id @default(autoincrement())    
    nome               String    
    agrupadorDePOMId  Int?           @relation(fields: [agrupadorDePOMId], references: [id])     
    agrupadorDePOM    AgrupadorDePOM?    
  }    
  ```    
  
### 4. Atualização de Testes    
- Implementar novos testes unitários e funcionais para garantir que todas as novas funcionalidades e a persistência estejam funcionando conforme esperado.    
- Certificar-se de que os testes cubram a inserção, atualização e deleção dos novos agrupadores e sua interação com os POMs.    
- Incluir testes para verificar a integridade da árvore após operações de "Drag and Drop".    
  
### 5. Documentação    
- Atualizar a documentação do projeto para incluir as novas funcionalidades e instruções sobre como usar o novo recurso de Agrupador de POMs.    
- Documentar as mudanças na estrutura do banco de dados e qualquer configuração necessária.    
- Incluir exemplos de uso e ilustrações explicativas para interações de "Drag and Drop".    
  
## Conclusão    
  
As melhorias propostas visam proporcionar uma melhor organização e visualização dos POMs, além de simplificar a experiência do usuário por meio de uma interface intuitiva e funcionalidades aprimoradas. A implementação bem-sucedida dessas modificações depende da atualização adequada de código, do banco de dados, da estrutura do ORM e de testes rigorosos para garantir a qualidade e a integridade do sistema.    
</PRD>