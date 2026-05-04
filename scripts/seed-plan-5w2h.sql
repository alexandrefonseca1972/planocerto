-- Inserir o primeiro plano 5W2H baseado na planilha planodeação.xlsx

-- Obter tenant_id
DO $$
DECLARE
    v_plan_id UUID;
    v_parent1 UUID;
    v_parent2 UUID;
    v_parent3 UUID;
    v_parent4 UUID;
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'planocerto' LIMIT 1;

    -- Criar o plano (cabeçalho)
    INSERT INTO public.action_plans (id, tenant_id, title, unit, director, goal, status, user_id)
    VALUES (gen_random_uuid(), v_tenant_id, 'Plano de Ação — Rio Branco', 'Rio Branco (Unimeta)', 'Adriana Assis Macedo',
            '7.908 INSC | 1.382 MF | 1.214 ACAD', 'active',
            (SELECT id FROM public.profiles WHERE email = 'alexandre.fonseca@live.com' LIMIT 1))
    RETURNING id INTO v_plan_id;

    -- CANAL 1: ESCOLAS
    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES (v_plan_id, NULL, '1', 0, 'AÇÕES CANAL - ESCOLAS', '', '', '', NULL, NULL, 'R$ -', '3', '0', 4);

    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES (v_plan_id, NULL, '2', 10, 'AÇÕES CANAL - EMPRESAS', '', '', '', NULL, NULL, 'R$ -', '17', '0', 4);

    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES (v_plan_id, NULL, '3', 20, 'AÇÕES CANAL - TRADE', '', '', '', NULL, NULL, 'R$ -', '45', '0', 4);

    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES (v_plan_id, NULL, '4', 30, 'AÇÕES CANAL - SALA DE MATRÍCULA', '', '', '', NULL, NULL, 'R$ -', '38', '0', 4);

    -- Sub-itens CANAL 1 (ESCOLAS)
    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '1' LIMIT 1),
         '1.1', 1, 'Atuar na base de Escola 26.1 (são 2457 classificados)',
         'Grande volume de inscritos e com baixa conversão de MF.',
         'UNIDADE', 'SM + FDV', '2026-04-28', '2026-04-28', '', '', '', 4),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '1' LIMIT 1),
         '1.2', 2, 'Atuar na base feira das profissões (81 classificados)',
         'Grande volume de inscritos e com baixa conversão de MF.',
         'UNIDADE', 'SM + FDV', '2026-04-28', '2026-04-28', '', '', '', 2),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '1' LIMIT 1),
         '1.3', 3, 'Atuar na base Enem (1011 classificados)',
         'Grande volume de inscritos e com baixa conversão de MF.',
         'UNIDADE', 'SM + FDV', '2026-04-28', '2026-04-28', '', '', '', 1);

    -- Sub-itens CANAL 2 (EMPRESAS)
    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '2' LIMIT 1),
         '2.1', 1, 'Ação na Empresa JJ Distribuidora.',
         'Empresa recém conveniada - a ativação será o inicio de um relacionamento e para realização de matrículas na hora.',
         'JJ Distribuidora', 'João Guilerme', '2026-04-06', '2026-04-06', '', '', '', 4),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '2' LIMIT 1),
         '2.2', 2, 'Ação Conversão o Campeonato de Futevolei',
         'A ação deu retorno sobre o interesse em matrícula, vamos focar na conversão.',
         'AABB', 'Gabriel Vieira', '2026-03-20', '2026-03-22', '', '', '', 4),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '2' LIMIT 1),
         '2.3', 3, 'Ação na Empresa Impetus Engenharia',
         'Empresa parceira e com ativações recorrentes. Com foco em conversão e relacionamento.',
         'Impetus Engenharia', 'João Guilerme', '2026-04-04', '2026-04-04', '', '', '', 4),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '2' LIMIT 1),
         '2.4', 4, 'Ação na Empresa Ernegisa',
         'Empresa parceira e com ativações recorrentes. Com foco em conversão e relacionamento.',
         'Energisa', 'João Guilerme', '2026-04-08', '2026-04-08', '', '', '', 4),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '2' LIMIT 1),
         '2.5', 5, 'Ação IAPEN - Centro de Controle',
         'Empresa recém conveniada - a ativação será o inicio de um relacionamento e para realização de matrículas na hora.',
         'IAPEN', 'Lucas', '2026-04-01', '2026-04-01', '', '', '', 2),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '2' LIMIT 1),
         '2.6', 6, 'Ação Empresa Casa da Sogra',
         'Empresa parceira e com ativações recorrentes. Com foco em conversão e relacionamento.',
         'Casa da Sogra', 'Jozvania', NULL, NULL, '', '', '', 2);

    -- Sub-itens CANAL 3 (TRADE)
    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '3' LIMIT 1),
         '3.1', 1, 'Realizar Ação de TRADE (PAP) no comércio local para a divulgação de cursos e atributos da unidade.',
         'Local com grande fluxo de pessoas e com muita possibilidade de trade.',
         'ESTAÇÃO EXPERIMENTAL', 'FDV', '2026-04-01', '2026-04-01', '', '', '', 1),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '3' LIMIT 1),
         '3.2', 2, 'Realizar Ação de TRADE (PAP) no comércio local para a divulgação de cursos e atributos da unidade.',
         'Local com grande fluxo de pessoas e com muita possibilidade de trade.',
         'AV. NAÇÕES UNIDAS', 'FDV', '2026-04-02', '2026-04-02', '', '', '', 1),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '3' LIMIT 1),
         '3.3', 3, 'Realizar Ação de TRADE (PAP) no comércio local para a divulgação de cursos e atributos da unidade.',
         'Local com grande fluxo de pessoas e com muita possibilidade de trade.',
         'TERMINAL URBANO', 'FDV', '2026-04-03', '2026-04-03', '', '', '', 1),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '3' LIMIT 1),
         '3.4', 4, 'Realizar Ação de TRADE (PAP) no comércio local para a divulgação de cursos e atributos da unidade.',
         'Local com grande fluxo de pessoas e com muita possibilidade de trade.',
         'BAIRRO AVIÁRIO', 'FDV', '2026-04-08', '2026-04-08', '', '', '', 1),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '3' LIMIT 1),
         '3.5', 5, 'Realizar Ação de TRADE (PAP) no comércio local para a divulgação de cursos e atributos da unidade.',
         'Local com grande fluxo de pessoas e com muita possibilidade de trade.',
         'PRAÇA DA REVOLUÇÃO', 'FDV', '2026-04-09', '2026-04-09', '', '', '', 1),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '3' LIMIT 1),
         '3.6', 6, 'Realizar Ação de TRADE (PAP) no comércio local para a divulgação de cursos e atributos da unidade.',
         'Local com grande fluxo de pessoas e com muita possibilidade de trade.',
         'COHAB DO BOSQUE', 'FDV', '2026-04-10', '2026-04-10', '', '', '', 1),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '3' LIMIT 1),
         '3.7', 7, 'Realizar Ação de TRADE (PAP) no comércio local para a divulgação de cursos e atributos da unidade.',
         'Local com grande fluxo de pessoas e com muita possibilidade de trade.',
         'FEIRA DO MERCADO MUNICIPAL', 'FDV', '2026-04-04', '2026-04-04', '', '', '', 1);

    -- Sub-itens CANAL 4 (SALA DE MATRÍCULA)
    INSERT INTO public.action_items (plan_id, parent_id, number, sort_order, action, why, "where", responsible,
        planned_start, planned_end, cost, expected_result, actual_result, status)
    VALUES
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '4' LIMIT 1),
         '4.1', 1, 'Acompanhar as matrículas financeiras e matrículas acadêmicas do FIES',
         'O canal receberá o número de MF e MA que rodarem.',
         'UNIDADE', 'EDUARDO + SECRETARIA', '2026-03-28', '2026-04-06', '', '30', '0', 1),
        (v_plan_id, (SELECT id FROM public.action_items WHERE plan_id = v_plan_id AND number = '4' LIMIT 1),
         '4.2', 2, 'Conversão de Funil invertido Março (464)',
         'Foco na conversão de leads do funil invertido.',
         'UNIDADE', 'SM', '2026-03-30', '2026-03-30', '', '8', '0', 1);
END $$;
