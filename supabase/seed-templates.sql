-- Seed: Default plan templates
INSERT INTO public.plan_templates (id, name, title, unit, director, goal, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Plano de Ação Comercial', 'Plano de Ação Comercial', 'Comercial', 'Diretor Comercial', 'Aumentar vendas e expandir carteira de clientes', true),
  ('00000000-0000-0000-0000-000000000002', 'Plano de Melhoria Operacional', 'Plano de Melhoria Operacional', 'Operações', 'Diretor de Operações', 'Otimizar processos e reduzir custos operacionais', true),
  ('00000000-0000-0000-0000-000000000003', 'Plano de Expansão', 'Plano de Expansão', 'Expansão', 'Diretor de Expansão', 'Expandir para novas regiões e mercados', true)
ON CONFLICT DO NOTHING;

-- Template 1: Comercial
INSERT INTO public.plan_template_items (template_id, number, sort_order, action, why, where_field, responsible, cost, expected_result) VALUES
  ('00000000-0000-0000-0000-000000000001', '1', 1, 'Realizar diagnóstico de mercado', 'Identificar oportunidades e ameaças', 'Sede', 'Analista Comercial', 'R$ 0', 'Relatório de mercado concluído'),
  ('00000000-0000-0000-0000-000000000001', '2', 2, 'Definir metas de vendas por região', 'Estabelecer objetivos mensuráveis', 'Sede', 'Gerente Comercial', 'R$ 0', 'Metas definidas e aprovadas'),
  ('00000000-0000-0000-0000-000000000001', '3', 3, 'Contratar e treinar equipe de vendas', 'Aumentar capacidade de atendimento', 'RH', 'Gerente de RH', 'R$ 15.000', 'Equipe contratada e treinada'),
  ('00000000-0000-0000-0000-000000000001', '4', 4, 'Implementar CRM', 'Centralizar gestão de clientes', 'TI', 'Coordenador de TI', 'R$ 5.000', 'CRM operacional'),
  ('00000000-0000-0000-0000-000000000001', '5', 5, 'Criar campanha de prospecção', 'Gerar leads qualificados', 'Marketing', 'Coordenador de Marketing', 'R$ 8.000', 'Leads gerados'),
  ('00000000-0000-0000-0000-000000000001', '6', 6, 'Definir política de preços e descontos', 'Padronizar negociações', 'Financeiro', 'Analista Financeiro', 'R$ 0', 'Política documentada'),
  ('00000000-0000-0000-0000-000000000001', '7', 7, 'Estabelecer metas de pós-venda', 'Fidelizar clientes', 'Comercial', 'Supervisor de Vendas', 'R$ 2.000', 'Programa de fidelização ativo'),
  ('00000000-0000-0000-0000-000000000001', '8', 8, 'Monitorar KPIs de vendas', 'Acompanhar desempenho', 'Comercial', 'Analista Comercial', 'R$ 0', 'Dashboard de KPIs'),
  ('00000000-0000-0000-0000-000000000001', '9', 9, 'Revisar carteira de clientes', 'Identificar clientes inativos', 'Comercial', 'Vendedor Sênior', 'R$ 0', 'Carteira revisada'),
  ('00000000-0000-0000-0000-000000000001', '10', 10, 'Realizar treinamento de vendas trimestral', 'Atualizar técnicas de vendas', 'Sede', 'Gerente Comercial', 'R$ 3.000', 'Treinamento realizado'),
  ('00000000-0000-0000-0000-000000000001', '11', 11, 'Criar programa de indicação de clientes', 'Aumentar base via referrals', 'Marketing', 'Coordenador de Marketing', 'R$ 1.000', 'Programa ativo'),
  ('00000000-0000-0000-0000-000000000001', '12', 12, 'Analisar concorrência trimestralmente', 'Manter competitividade', 'Comercial', 'Analista de Mercado', 'R$ 0', 'Relatório trimestral')
ON CONFLICT DO NOTHING;

-- Template 2: Operacional  
INSERT INTO public.plan_template_items (template_id, number, sort_order, action, why, where_field, responsible, cost, expected_result) VALUES
  ('00000000-0000-0000-0000-000000000002', '1', 1, 'Mapear processos atuais', 'Identificar gargalos operacionais', 'Operações', 'Analista de Processos', 'R$ 0', 'Mapa de processos documentado'),
  ('00000000-0000-0000-0000-000000000002', '2', 2, 'Identificar desperdícios e retrabalho', 'Reduzir custos operacionais', 'Operações', 'Supervisor de Produção', 'R$ 0', 'Relatório de desperdícios'),
  ('00000000-0000-0000-0000-000000000002', '3', 3, 'Implementar metodologia 5S', 'Organizar ambiente de trabalho', 'Fábrica', 'Coordenador de Qualidade', 'R$ 2.000', '5S implementado'),
  ('00000000-0000-0000-0000-000000000002', '4', 4, 'Automatizar relatórios operacionais', 'Reduzir tempo de compilação de dados', 'TI', 'Analista de TI', 'R$ 4.000', 'Relatórios automatizados'),
  ('00000000-0000-0000-0000-000000000002', '5', 5, 'Revisar procedimentos de segurança', 'Prevenir acidentes de trabalho', 'Fábrica', 'Técnico de Segurança', 'R$ 1.500', 'Procedimentos atualizados'),
  ('00000000-0000-0000-0000-000000000002', '6', 6, 'Implementar manutenção preventiva', 'Reduzir paradas não programadas', 'Manutenção', 'Supervisor de Manutenção', 'R$ 10.000', 'Plano de manutenção ativo'),
  ('00000000-0000-0000-0000-000000000002', '7', 7, 'Otimizar layout do estoque', 'Melhorar fluxo de materiais', 'Almoxarifado', 'Encarregado de Estoque', 'R$ 3.000', 'Layout otimizado'),
  ('00000000-0000-0000-0000-000000000002', '8', 8, 'Treinar equipe em lean manufacturing', 'Capacitar para melhoria contínua', 'Sede', 'Consultor Lean', 'R$ 8.000', 'Equipe certificada'),
  ('00000000-0000-0000-0000-000000000002', '9', 9, 'Estabelecer indicadores de eficiência', 'Medir OEE e produtividade', 'Operações', 'Analista de Dados', 'R$ 0', 'Dashboard de OEE'),
  ('00000000-0000-0000-0000-000000000002', '10', 10, 'Criar plano de contingência operacional', 'Mitigar riscos de interrupção', 'Operações', 'Gerente de Operações', 'R$ 0', 'Plano documentado')
ON CONFLICT DO NOTHING;

-- Template 3: Expansão
INSERT INTO public.plan_template_items (template_id, number, sort_order, action, why, where_field, responsible, cost, expected_result) VALUES
  ('00000000-0000-0000-0000-000000000003', '1', 1, 'Realizar estudo de viabilidade', 'Avaliar mercado e retorno esperado', 'Sede', 'Analista de Negócios', 'R$ 5.000', 'Estudo de viabilidade concluído'),
  ('00000000-0000-0000-0000-000000000003', '2', 2, 'Selecionar localização estratégica', 'Maximizar alcance do público-alvo', 'Nova Unidade', 'Diretor de Expansão', 'R$ 2.000', 'Local definido'),
  ('00000000-0000-0000-0000-000000000003', '3', 3, 'Elaborar projeto arquitetônico', 'Dimensionar espaço físico', 'Nova Unidade', 'Arquiteto', 'R$ 15.000', 'Projeto aprovado'),
  ('00000000-0000-0000-0000-000000000003', '4', 4, 'Obter licenças e alvarás', 'Regularizar operação', 'Prefeitura', 'Consultor Jurídico', 'R$ 3.000', 'Documentação obtida'),
  ('00000000-0000-0000-0000-000000000003', '5', 5, 'Definir orçamento de abertura', 'Controlar investimento inicial', 'Financeiro', 'Analista Financeiro', 'R$ 0', 'Orçamento aprovado'),
  ('00000000-0000-0000-0000-000000000003', '6', 6, 'Contratar equipe inicial', 'Formar time para operação', 'RH', 'Gerente de RH', 'R$ 5.000', 'Equipe contratada'),
  ('00000000-0000-0000-0000-000000000003', '7', 7, 'Adquirir equipamentos e mobiliário', 'Estruturar unidade', 'Compras', 'Comprador', 'R$ 50.000', 'Equipamentos instalados'),
  ('00000000-0000-0000-0000-000000000003', '8', 8, 'Implementar sistemas e infraestrutura', 'Garantir operação de TI', 'TI', 'Coordenador de TI', 'R$ 8.000', 'Sistemas operacionais')
ON CONFLICT DO NOTHING;
