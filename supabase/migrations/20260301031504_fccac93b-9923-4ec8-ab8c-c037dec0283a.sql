
-- Seed: 18 máquinas de cartão com taxas do Excel
-- Nota: valor 90.50% na Cielo-Elo-Shopping Sul 7x corrigido para 9.05%

INSERT INTO public.maquinas_cartao (nome, cnpj_vinculado, conta_origem, status, percentual_maquina, taxas, parcelamentos) VALUES

-- 1) Cielo - Elo - Matriz
('Cielo - Elo - Matriz', '53295194000166', 'Bradesco Thiago Eduardo', 'Ativo', 1.38,
 '{"debito":1.38,"credito":{"1":3.49,"2":5.04,"3":5.67,"4":6.30,"5":6.96,"6":7.62,"7":8.56,"8":9.39,"9":10.49,"10":10.85,"11":11.66,"12":12.83}}',
 '[{"parcelas":1,"taxa":3.49},{"parcelas":2,"taxa":5.04},{"parcelas":3,"taxa":5.67},{"parcelas":4,"taxa":6.30},{"parcelas":5,"taxa":6.96},{"parcelas":6,"taxa":7.62},{"parcelas":7,"taxa":8.56},{"parcelas":8,"taxa":9.39},{"parcelas":9,"taxa":10.49},{"parcelas":10,"taxa":10.85},{"parcelas":11,"taxa":11.66},{"parcelas":12,"taxa":12.83}]'),

-- 2) Cielo - Visa/Master - Matriz
('Cielo - Visa/Master - Matriz', '53295194000166', 'Bradesco Thiago Eduardo', 'Ativo', 0.86,
 '{"debito":0.86,"credito":{"1":2.97,"2":4.43,"3":5.06,"4":5.69,"5":6.35,"6":7.01,"7":7.81,"8":8.64,"9":9.74,"10":10.10,"11":10.91,"12":12.08}}',
 '[{"parcelas":1,"taxa":2.97},{"parcelas":2,"taxa":4.43},{"parcelas":3,"taxa":5.06},{"parcelas":4,"taxa":5.69},{"parcelas":5,"taxa":6.35},{"parcelas":6,"taxa":7.01},{"parcelas":7,"taxa":7.81},{"parcelas":8,"taxa":8.64},{"parcelas":9,"taxa":9.74},{"parcelas":10,"taxa":10.10},{"parcelas":11,"taxa":10.91},{"parcelas":12,"taxa":12.08}]'),

-- 3) Cielo - Elo - Online
('Cielo - Elo - Online', '53197533000106', 'Bradesco Thiago Imports', 'Ativo', 1.46,
 '{"debito":1.46,"credito":{"1":3.88,"2":5.93,"3":6.48,"4":6.99,"5":7.54,"6":8.07,"7":8.59,"8":9.68,"9":10.31,"10":11.00,"11":12.11,"12":13.52}}',
 '[{"parcelas":1,"taxa":3.88},{"parcelas":2,"taxa":5.93},{"parcelas":3,"taxa":6.48},{"parcelas":4,"taxa":6.99},{"parcelas":5,"taxa":7.54},{"parcelas":6,"taxa":8.07},{"parcelas":7,"taxa":8.59},{"parcelas":8,"taxa":9.68},{"parcelas":9,"taxa":10.31},{"parcelas":10,"taxa":11.00},{"parcelas":11,"taxa":12.11},{"parcelas":12,"taxa":13.52}]'),

-- 4) Cielo - Visa - Online
('Cielo - Visa - Online', '53197533000106', 'Bradesco Thiago Imports', 'Ativo', 1.10,
 '{"debito":1.10,"credito":{"1":3.33,"2":5.28,"3":5.83,"4":6.34,"5":6.89,"6":7.42,"7":8.43,"8":9.52,"9":10.15,"10":10.84,"11":11.95,"12":13.36}}',
 '[{"parcelas":1,"taxa":3.33},{"parcelas":2,"taxa":5.28},{"parcelas":3,"taxa":5.83},{"parcelas":4,"taxa":6.34},{"parcelas":5,"taxa":6.89},{"parcelas":6,"taxa":7.42},{"parcelas":7,"taxa":8.43},{"parcelas":8,"taxa":9.52},{"parcelas":9,"taxa":10.15},{"parcelas":10,"taxa":10.84},{"parcelas":11,"taxa":11.95},{"parcelas":12,"taxa":13.36}]'),

-- 5) Cielo - Master - Online
('Cielo - Master - Online', '53197533000106', 'Bradesco Thiago Imports', 'Ativo', 0.91,
 '{"debito":0.91,"credito":{"1":3.33,"2":5.28,"3":5.83,"4":6.34,"5":6.89,"6":7.42,"7":8.21,"8":9.30,"9":9.93,"10":10.62,"11":11.73,"12":13.14}}',
 '[{"parcelas":1,"taxa":3.33},{"parcelas":2,"taxa":5.28},{"parcelas":3,"taxa":5.83},{"parcelas":4,"taxa":6.34},{"parcelas":5,"taxa":6.89},{"parcelas":6,"taxa":7.42},{"parcelas":7,"taxa":8.21},{"parcelas":8,"taxa":9.30},{"parcelas":9,"taxa":9.93},{"parcelas":10,"taxa":10.62},{"parcelas":11,"taxa":11.73},{"parcelas":12,"taxa":13.14}]'),

-- 6) Cielo - Elo - Shopping Sul
('Cielo - Elo - Shopping Sul', '55449390000173', 'Bradesco Acessorios', 'Ativo', 2.37,
 '{"debito":2.37,"credito":{"1":4.18,"2":5.73,"3":6.43,"4":7.09,"5":7.77,"6":8.41,"7":9.05,"8":9.59,"9":10.14,"10":10.83,"11":11.61,"12":12.39}}',
 '[{"parcelas":1,"taxa":4.18},{"parcelas":2,"taxa":5.73},{"parcelas":3,"taxa":6.43},{"parcelas":4,"taxa":7.09},{"parcelas":5,"taxa":7.77},{"parcelas":6,"taxa":8.41},{"parcelas":7,"taxa":9.05},{"parcelas":8,"taxa":9.59},{"parcelas":9,"taxa":10.14},{"parcelas":10,"taxa":10.83},{"parcelas":11,"taxa":11.61},{"parcelas":12,"taxa":12.39}]'),

-- 7) Cielo - Visa - Shopping Sul
('Cielo - Visa - Shopping Sul', '55449390000173', 'Bradesco Acessorios', 'Ativo', 1.83,
 '{"debito":1.83,"credito":{"1":3.64,"2":6.03,"3":6.73,"4":7.39,"5":8.07,"6":8.71,"7":8.69,"8":9.23,"9":9.78,"10":10.47,"11":11.25,"12":12.03}}',
 '[{"parcelas":1,"taxa":3.64},{"parcelas":2,"taxa":6.03},{"parcelas":3,"taxa":6.73},{"parcelas":4,"taxa":7.39},{"parcelas":5,"taxa":8.07},{"parcelas":6,"taxa":8.71},{"parcelas":7,"taxa":8.69},{"parcelas":8,"taxa":9.23},{"parcelas":9,"taxa":9.78},{"parcelas":10,"taxa":10.47},{"parcelas":11,"taxa":11.25},{"parcelas":12,"taxa":12.03}]'),

-- 8) Cielo - Master - Shopping Sul
('Cielo - Master - Shopping Sul', '55449390000173', 'Bradesco Acessorios', 'Ativo', 1.03,
 '{"debito":1.03,"credito":{"1":4.44,"2":6.03,"3":6.73,"4":7.39,"5":8.07,"6":8.71,"7":9.35,"8":9.89,"9":10.44,"10":11.13,"11":11.91,"12":12.69}}',
 '[{"parcelas":1,"taxa":4.44},{"parcelas":2,"taxa":6.03},{"parcelas":3,"taxa":6.73},{"parcelas":4,"taxa":7.39},{"parcelas":5,"taxa":8.07},{"parcelas":6,"taxa":8.71},{"parcelas":7,"taxa":9.35},{"parcelas":8,"taxa":9.89},{"parcelas":9,"taxa":10.44},{"parcelas":10,"taxa":11.13},{"parcelas":11,"taxa":11.91},{"parcelas":12,"taxa":12.69}]'),

-- 9) Cielo - Elo - Assistencia
('Cielo - Elo - Assistencia', '54872234000158', 'Bradesco Assistencia', 'Ativo', 2.49,
 '{"debito":2.49,"credito":{"1":3.96,"2":7.91,"3":9.08,"4":9.91,"5":10.41,"6":10.85,"7":9.25,"8":10.27,"9":11.06,"10":11.83,"11":12.69,"12":13.43}}',
 '[{"parcelas":1,"taxa":3.96},{"parcelas":2,"taxa":7.91},{"parcelas":3,"taxa":9.08},{"parcelas":4,"taxa":9.91},{"parcelas":5,"taxa":10.41},{"parcelas":6,"taxa":10.85},{"parcelas":7,"taxa":9.25},{"parcelas":8,"taxa":10.27},{"parcelas":9,"taxa":11.06},{"parcelas":10,"taxa":11.83},{"parcelas":11,"taxa":12.69},{"parcelas":12,"taxa":13.43}]'),

-- 10) Cielo - Visa - Assistencia
('Cielo - Visa - Assistencia', '54872234000158', 'Bradesco Assistencia', 'Ativo', 1.89,
 '{"debito":1.89,"credito":{"1":4.49,"2":7.29,"3":8.46,"4":9.29,"5":9.79,"6":10.23,"7":9.19,"8":10.21,"9":11.00,"10":11.77,"11":12.63,"12":13.37}}',
 '[{"parcelas":1,"taxa":4.49},{"parcelas":2,"taxa":7.29},{"parcelas":3,"taxa":8.46},{"parcelas":4,"taxa":9.29},{"parcelas":5,"taxa":9.79},{"parcelas":6,"taxa":10.23},{"parcelas":7,"taxa":9.19},{"parcelas":8,"taxa":10.21},{"parcelas":9,"taxa":11.00},{"parcelas":10,"taxa":11.77},{"parcelas":11,"taxa":12.63},{"parcelas":12,"taxa":13.37}]'),

-- 11) Cielo - Master - Assistencia
('Cielo - Master - Assistencia', '54872234000158', 'Bradesco Assistencia', 'Ativo', 1.89,
 '{"debito":1.89,"credito":{"1":4.49,"2":7.41,"3":8.58,"4":9.41,"5":9.91,"6":10.35,"7":9.22,"8":10.24,"9":11.03,"10":11.80,"11":12.66,"12":13.40}}',
 '[{"parcelas":1,"taxa":4.49},{"parcelas":2,"taxa":7.41},{"parcelas":3,"taxa":8.58},{"parcelas":4,"taxa":9.41},{"parcelas":5,"taxa":9.91},{"parcelas":6,"taxa":10.35},{"parcelas":7,"taxa":9.22},{"parcelas":8,"taxa":10.24},{"parcelas":9,"taxa":11.03},{"parcelas":10,"taxa":11.80},{"parcelas":11,"taxa":12.66},{"parcelas":12,"taxa":13.40}]'),

-- 12) Cielo - Elo - JK
('Cielo - Elo - JK', '62.968.637/0001-23', 'Sicoob JK', 'Ativo', 1.47,
 '{"debito":1.47,"credito":{"1":3.89,"2":6.31,"3":6.86,"4":7.37,"5":7.92,"6":8.45,"7":8.69,"8":9.78,"9":10.41,"10":11.10,"11":12.21,"12":13.62}}',
 '[{"parcelas":1,"taxa":3.89},{"parcelas":2,"taxa":6.31},{"parcelas":3,"taxa":6.86},{"parcelas":4,"taxa":7.37},{"parcelas":5,"taxa":7.92},{"parcelas":6,"taxa":8.45},{"parcelas":7,"taxa":8.69},{"parcelas":8,"taxa":9.78},{"parcelas":9,"taxa":10.41},{"parcelas":10,"taxa":11.10},{"parcelas":11,"taxa":12.21},{"parcelas":12,"taxa":13.62}]'),

-- 13) Cielo - Visa - JK
('Cielo - Visa - JK', '62.968.637/0001-23', 'Sicoob JK', 'Ativo', 1.02,
 '{"debito":1.02,"credito":{"1":3.34,"2":5.35,"3":5.90,"4":6.41,"5":6.96,"6":7.49,"7":8.23,"8":9.32,"9":9.95,"10":10.64,"11":11.75,"12":13.16}}',
 '[{"parcelas":1,"taxa":3.34},{"parcelas":2,"taxa":5.35},{"parcelas":3,"taxa":5.90},{"parcelas":4,"taxa":6.41},{"parcelas":5,"taxa":6.96},{"parcelas":6,"taxa":7.49},{"parcelas":7,"taxa":8.23},{"parcelas":8,"taxa":9.32},{"parcelas":9,"taxa":9.95},{"parcelas":10,"taxa":10.64},{"parcelas":11,"taxa":11.75},{"parcelas":12,"taxa":13.16}]'),

-- 14) Cielo - Master - JK
('Cielo - Master - JK', '62.968.637/0001-23', 'Sicoob JK', 'Ativo', 0.92,
 '{"debito":0.92,"credito":{"1":3.34,"2":5.61,"3":6.16,"4":6.67,"5":7.22,"6":7.75,"7":8.10,"8":9.19,"9":9.82,"10":10.51,"11":11.62,"12":13.06}}',
 '[{"parcelas":1,"taxa":3.34},{"parcelas":2,"taxa":5.61},{"parcelas":3,"taxa":6.16},{"parcelas":4,"taxa":6.67},{"parcelas":5,"taxa":7.22},{"parcelas":6,"taxa":7.75},{"parcelas":7,"taxa":8.10},{"parcelas":8,"taxa":9.19},{"parcelas":9,"taxa":9.82},{"parcelas":10,"taxa":10.51},{"parcelas":11,"taxa":11.62},{"parcelas":12,"taxa":13.06}]'),

-- 15) Pagbank - Elo - Shopping Aguas Lindas
('Pagbank - Elo - Shopping Aguas Lindas', NULL, 'Pagbank', 'Ativo', 1.50,
 '{"debito":1.50,"credito":{"1":3.50,"2":5.73,"3":6.56,"4":7.38,"5":8.19,"6":8.98,"7":10.08,"8":10.86,"9":11.63,"10":12.39,"11":13.15,"12":13.89,"13":14.63,"14":15.36,"15":16.08,"16":16.79,"17":17.50,"18":18.20}}',
 '[{"parcelas":1,"taxa":3.50},{"parcelas":2,"taxa":5.73},{"parcelas":3,"taxa":6.56},{"parcelas":4,"taxa":7.38},{"parcelas":5,"taxa":8.19},{"parcelas":6,"taxa":8.98},{"parcelas":7,"taxa":10.08},{"parcelas":8,"taxa":10.86},{"parcelas":9,"taxa":11.63},{"parcelas":10,"taxa":12.39},{"parcelas":11,"taxa":13.15},{"parcelas":12,"taxa":13.89},{"parcelas":13,"taxa":14.63},{"parcelas":14,"taxa":15.36},{"parcelas":15,"taxa":16.08},{"parcelas":16,"taxa":16.79},{"parcelas":17,"taxa":17.50},{"parcelas":18,"taxa":18.20}]'),

-- 16) Pagbank - Visa - Shopping Aguas Lindas
('Pagbank - Visa - Shopping Aguas Lindas', NULL, 'Pagbank', 'Ativo', 1.08,
 '{"debito":1.08,"credito":{"1":3.29,"2":4.61,"3":5.44,"4":6.26,"5":7.07,"6":7.86,"7":8.86,"8":9.64,"9":10.41,"10":11.17,"11":11.93,"12":12.67,"13":14.21,"14":14.94,"15":15.66,"16":16.37,"17":17.08,"18":17.78}}',
 '[{"parcelas":1,"taxa":3.29},{"parcelas":2,"taxa":4.61},{"parcelas":3,"taxa":5.44},{"parcelas":4,"taxa":6.26},{"parcelas":5,"taxa":7.07},{"parcelas":6,"taxa":7.86},{"parcelas":7,"taxa":8.86},{"parcelas":8,"taxa":9.64},{"parcelas":9,"taxa":10.41},{"parcelas":10,"taxa":11.17},{"parcelas":11,"taxa":11.93},{"parcelas":12,"taxa":12.67},{"parcelas":13,"taxa":14.21},{"parcelas":14,"taxa":14.94},{"parcelas":15,"taxa":15.66},{"parcelas":16,"taxa":16.37},{"parcelas":17,"taxa":17.08},{"parcelas":18,"taxa":17.78}]'),

-- 17) Pagbank - Master - Shopping Aguas Lindas
('Pagbank - Master - Shopping Aguas Lindas', NULL, 'Pagbank', 'Ativo', 1.08,
 '{"debito":1.08,"credito":{"1":3.29,"2":4.61,"3":5.44,"4":6.26,"5":7.07,"6":7.86,"7":8.86,"8":9.64,"9":10.41,"10":11.17,"11":11.93,"12":12.67,"13":14.21,"14":14.94,"15":15.66,"16":16.37,"17":17.08,"18":17.78}}',
 '[{"parcelas":1,"taxa":3.29},{"parcelas":2,"taxa":4.61},{"parcelas":3,"taxa":5.44},{"parcelas":4,"taxa":6.26},{"parcelas":5,"taxa":7.07},{"parcelas":6,"taxa":7.86},{"parcelas":7,"taxa":8.86},{"parcelas":8,"taxa":9.64},{"parcelas":9,"taxa":10.41},{"parcelas":10,"taxa":11.17},{"parcelas":11,"taxa":11.93},{"parcelas":12,"taxa":12.67},{"parcelas":13,"taxa":14.21},{"parcelas":14,"taxa":14.94},{"parcelas":15,"taxa":15.66},{"parcelas":16,"taxa":16.37},{"parcelas":17,"taxa":17.08},{"parcelas":18,"taxa":17.78}]'),

-- 18) Terceirizada - TODAS - Todas Unidades
('Terceirizada - TODAS - Todas Unidades', NULL, 'Escritorio Terceirizado', 'Ativo', 2.96,
 '{"debito":2.96,"credito":{"1":4.80,"2":5.76,"3":6.38,"4":7.00,"5":7.62,"6":8.24,"7":8.82,"8":9.44,"9":10.06,"10":10.68,"11":11.30,"12":11.92,"13":12.54,"14":13.16,"15":13.78,"16":14.40,"17":15.02,"18":15.64}}',
 '[{"parcelas":1,"taxa":4.80},{"parcelas":2,"taxa":5.76},{"parcelas":3,"taxa":6.38},{"parcelas":4,"taxa":7.00},{"parcelas":5,"taxa":7.62},{"parcelas":6,"taxa":8.24},{"parcelas":7,"taxa":8.82},{"parcelas":8,"taxa":9.44},{"parcelas":9,"taxa":10.06},{"parcelas":10,"taxa":10.68},{"parcelas":11,"taxa":11.30},{"parcelas":12,"taxa":11.92},{"parcelas":13,"taxa":12.54},{"parcelas":14,"taxa":13.16},{"parcelas":15,"taxa":13.78},{"parcelas":16,"taxa":14.40},{"parcelas":17,"taxa":15.02},{"parcelas":18,"taxa":15.64}]');
