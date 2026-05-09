-- Seed de 50 fornecedores de exemplo (registros globais — tenant_id NULL).
-- Visíveis para todos os tenants. Idempotente: ON CONFLICT por (tenant_id, name).
-- Categorias variadas refletindo categorias_despesa do seed anterior.

INSERT INTO public.fornecedores
  (tenant_id, name, cnpj, categoria, contato_nome, contato_email, contato_telefone, observacoes, sort_order, active)
VALUES
  -- Marketing / Comunicação
  (NULL, 'Agência Pulse Marketing',         '12345678000101', 'Marketing',         'Renata Almeida',     'comercial@pulse.com.br',         '11987654321', 'Agência full-service de marketing digital.',     10, true),
  (NULL, 'Studio Norte Branding',           '12345678000102', 'Marketing',         'Carlos Tavares',     'contato@studionorte.com.br',     '11912345678', 'Branding e identidade visual.',                  10, true),
  (NULL, 'Mídia Direta Ltda',               '12345678000103', 'Marketing',         'Patrícia Souza',     'midia@mdireta.com.br',           '21999887766', 'Compra e gestão de mídia paga.',                 10, true),
  (NULL, 'Gráfica Central',                 '12345678000104', 'Material gráfico',  'Antônio Lima',       'pedidos@grafcentral.com.br',     '11944556677', 'Impressão de banners, panfletos e flyers.',     20, true),
  (NULL, 'Print Express SP',                '12345678000105', 'Material gráfico',  'Helena Cordeiro',    'atende@printexpress.com.br',     '11933221100', 'Impressões expressas em até 24h.',               20, true),

  -- TI / Tecnologia / Software
  (NULL, 'CloudOps Brasil',                 '12345678000106', 'TI',                'Bruno Carvalho',     'comercial@cloudops.com.br',      '11988776655', 'Provedor de infraestrutura em nuvem (AWS).',     30, true),
  (NULL, 'TechStack Soluções',              '12345678000107', 'TI',                'Marina Pires',       'vendas@techstack.com.br',        '11977665544', 'Desenvolvimento sob demanda e licenças SaaS.',   30, true),
  (NULL, 'NetSec Consultoria',              '12345678000108', 'TI',                'Felipe Andrade',     'contato@netsec.com.br',          '21988445566', 'Pentest e segurança da informação.',             30, true),
  (NULL, 'Microsoft 365 (Distrib.)',        '12345678000109', 'TI',                'Suporte 365',        'parceiros@m365dist.com.br',      '08001234567', 'Distribuidor autorizado de licenças Microsoft.', 30, true),
  (NULL, 'Google Workspace BR',             '12345678000110', 'TI',                'Atendimento GW',     'parceiros@gw.com.br',            '08007654321', 'Licenças e suporte Google Workspace.',           30, true),

  -- Limpeza / Conservação
  (NULL, 'Limpa Fácil Serviços',            '12345678000111', 'Limpeza',           'Joana Ribeiro',      'comercial@limpafacil.com.br',    '11955443322', 'Limpeza diária e periódica de escritórios.',     40, true),
  (NULL, 'CleanPro Conservação',            '12345678000112', 'Limpeza',           'Ricardo Barros',     'contato@cleanpro.com.br',        '11944332211', 'Higienização e limpeza pós-obra.',               40, true),
  (NULL, 'Eco Sustentável Limpeza',         '12345678000113', 'Limpeza',           'Tatiane Mendes',     'eco@sustlimpeza.com.br',         '11933221199', 'Produtos biodegradáveis.',                       40, true),

  -- Alimentação / Cafeteria
  (NULL, 'Café Premium Distribuição',       '12345678000114', 'Alimentação',       'Rafael Nunes',       'pedidos@cafepremium.com.br',     '11922110099', 'Café em grãos e cápsulas para empresas.',        50, true),
  (NULL, 'Frutaria do Mercado',             '12345678000115', 'Alimentação',       'Sandra Vieira',      'pedido@frutariamerc.com.br',     '11911009988', 'Cestas de frutas semanais.',                     50, true),
  (NULL, 'Padaria Pão Quente',              '12345678000116', 'Alimentação',       'Pedro Rocha',        'comercial@paoquente.com.br',     '11900998877', 'Salgados e doces para reuniões.',                50, true),
  (NULL, 'Aqua Pure Galões',                '12345678000117', 'Alimentação',       'Lúcia Fontes',       'entrega@aquapure.com.br',        '11999887700', 'Galões de água mineral 20L.',                    50, true),

  -- Manutenção / Reformas
  (NULL, 'Manutec Manutenção Predial',      '12345678000118', 'Manutenção',        'Marcos Antunes',     'manutencao@manutec.com.br',      '11988776600', 'Manutenção elétrica e hidráulica.',              60, true),
  (NULL, 'Ar Frio Climatização',            '12345678000119', 'Manutenção',        'Fernanda Lopes',     'comercial@arfrio.com.br',        '11977665500', 'Manutenção e instalação de ar-condicionado.',    60, true),
  (NULL, 'Pinta Bem Pinturas',              '12345678000120', 'Manutenção',        'José Carlos',        'orcamento@pintabem.com.br',      '11966554400', 'Pinturas comerciais e residenciais.',            60, true),
  (NULL, 'Vidrolar Vidraçaria',             '12345678000121', 'Manutenção',        'Luciana Castro',     'pedido@vidrolar.com.br',         '11955443300', 'Box, espelhos e vidros sob medida.',             60, true),

  -- Folha / RH / Benefícios
  (NULL, 'Sodexo Vale Refeição',            '12345678000122', 'Folha',             'Gestão Empresarial', 'empresas@sodexo.com.br',         '08007020703', 'VR/VA e benefícios.',                            70, true),
  (NULL, 'Alelo Benefícios',                '12345678000123', 'Folha',             'Atendimento Alelo',  'rh@alelo.com.br',                '08007777225', 'Cartão refeição e alimentação.',                 70, true),
  (NULL, 'Unimed Saúde',                    '12345678000124', 'Folha',             'Vendas Empresarial', 'empresarial@unimed.com.br',      '08007267777', 'Plano de saúde empresarial.',                    70, true),
  (NULL, 'Porto Saúde Odonto',              '12345678000125', 'Folha',             'Atendimento Odonto', 'odonto@portosaude.com.br',       '1140044300',  'Plano odontológico.',                            70, true),
  (NULL, 'GupyRecrutamento',                '12345678000126', 'Folha',             'Carla Pinheiro',     'comercial@gupy.com.br',          '11944332299', 'Plataforma de recrutamento e seleção.',          70, true),

  -- Aluguel / Imóveis
  (NULL, 'Cushman & Wakefield BR',          '12345678000127', 'Aluguel',           'Locação Corporativa','locacao@cw.com.br',              '1130301010',  'Locação de salas e andares corporativos.',       80, true),
  (NULL, 'WeWork Brasil',                   '12345678000128', 'Aluguel',           'Vendas WeWork',      'comercial@wework.com.br',        '08009401234', 'Coworking e escritórios privativos.',            80, true),
  (NULL, 'Regus Centros de Negócios',       '12345678000129', 'Aluguel',           'Atendimento Regus',  'contato@regus.com.br',           '08007222000', 'Salas privativas e flexíveis.',                  80, true),

  -- Insumos / Material de escritório
  (NULL, 'Kalunga Distribuidora',           '12345678000130', 'Insumos',           'Vendas Corporativo', 'corp@kalunga.com.br',            '08007267336', 'Material de escritório e papelaria.',            90, true),
  (NULL, 'Office Supply',                   '12345678000131', 'Insumos',           'Beatriz Rocha',      'pedidos@officesupply.com.br',    '11988776633', 'Cartuchos, toner e suprimentos.',                90, true),
  (NULL, 'Mobile Mobiliário',               '12345678000132', 'Insumos',           'Daniel Esteves',     'vendas@mobilemobiliario.com.br', '11977665522', 'Móveis para escritório.',                        90, true),
  (NULL, 'Staples Brasil',                  '12345678000133', 'Insumos',           'Atendimento Staples','b2b@staples.com.br',             '08007777445', 'Suprimentos diversos.',                          90, true),

  -- Serviços / Consultoria / Profissionais
  (NULL, 'KPMG Auditoria',                  '12345678000134', 'Serviços',          'Relacionamento KPMG','clientes@kpmg.com.br',           '1133333333',  'Auditoria e consultoria contábil.',             100, true),
  (NULL, 'Mattos Filho Advogados',          '12345678000135', 'Serviços',          'Atendimento Jurídico','contato@mattosfilho.com.br',    '1133334444',  'Assessoria jurídica empresarial.',              100, true),
  (NULL, 'Contabilizei',                    '12345678000136', 'Serviços',          'Suporte Contábil',   'contato@contabilizei.com.br',    '08007227222', 'Contabilidade online.',                         100, true),
  (NULL, 'GoCloud Consultoria',             '12345678000137', 'Serviços',          'Pedro Magalhães',    'contato@gocloud.com.br',         '11944551122', 'Consultoria em transformação digital.',         100, true),
  (NULL, 'BR Logística Express',            '12345678000138', 'Serviços',          'Logística Comercial','comercial@brlogex.com.br',       '0800123987',  'Fretes e transporte de cargas.',                100, true),
  (NULL, 'Correios — Conta Empresarial',    '12345678000139', 'Serviços',          'Atendimento PJ',     'empresas@correios.com.br',       '0800725000',  'Postagens corporativas e Sedex.',               100, true),

  -- Impostos / Tributos
  (NULL, 'Receita Federal — Tributos',      '',               'Impostos',          'Atendimento RFB',    '',                                '',            'Pagamentos federais (DARF, etc.).',             110, true),
  (NULL, 'SEFAZ Estadual',                  '',               'Impostos',          'Atendimento SEFAZ',  '',                                '',            'ICMS e tributos estaduais.',                    110, true),
  (NULL, 'Prefeitura — ISS',                '',               'Impostos',          'Atendimento PMSP',   '',                                '',            'ISS municipal.',                                110, true),

  -- Energia / Utilidades
  (NULL, 'Enel Distribuição',               '12345678000140', 'Outros',            'Atendimento Enel',   'empresas@enel.com.br',           '08007272196', 'Conta de energia elétrica.',                    120, true),
  (NULL, 'Sabesp Empresarial',              '12345678000141', 'Outros',            'Atendimento PJ',     'empresas@sabesp.com.br',         '08000550195', 'Conta de água/esgoto.',                         120, true),
  (NULL, 'Comgás',                          '12345678000142', 'Outros',            'Atendimento Comgás', 'corp@comgas.com.br',             '08000900007', 'Gás encanado para empresas.',                   120, true),
  (NULL, 'Vivo Empresas',                   '12345678000143', 'Outros',            'Vendas Corporativo', 'corp@vivo.com.br',               '11912340315', 'Telefonia e internet corporativa.',             120, true),
  (NULL, 'Claro Empresas',                  '12345678000144', 'Outros',            'Atendimento Claro',  'corp@claro.com.br',              '11912340321', 'Telefonia móvel e fibra.',                      120, true),

  -- Eventos / Treinamentos
  (NULL, 'Hotel Faria Lima Eventos',        '12345678000145', 'Outros',            'Comercial Eventos',  'eventos@hotelfl.com.br',         '1133335000',  'Salas e infraestrutura para eventos corporativos.',130, true),
  (NULL, 'Treina Mais Educação Corporativa','12345678000146', 'Outros',            'Atendimento Treina', 'contato@treinamais.com.br',      '11944778899', 'Treinamentos e workshops in-company.',          130, true),
  (NULL, 'Buffet Sabor & Arte',             '12345678000147', 'Outros',            'Reservas Buffet',    'reservas@saborearte.com.br',     '11933445566', 'Coffee breaks e coquetéis.',                    130, true),
  (NULL, 'Sound & Light Eventos',           '12345678000148', 'Outros',            'Operação Eventos',   'op@soundlight.com.br',           '11922336677', 'Som, luz e estrutura para eventos.',            130, true),
  (NULL, 'Translogix Locação de Veículos',  '12345678000149', 'Outros',            'Locação Frota',      'frotas@translogix.com.br',       '11911223344', 'Locação de carros para uso corporativo.',       130, true),
  (NULL, 'Localiza Frota Corporativa',      '12345678000150', 'Outros',            'Frota Empresarial',  'corporativo@localiza.com.br',    '0800979000',  'Aluguel de frota de longa duração.',            130, true)
ON CONFLICT (tenant_id, name) DO NOTHING;
