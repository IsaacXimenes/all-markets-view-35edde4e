-- Inserir 76 colaboradores da planilha
INSERT INTO colaboradores (nome, cpf, loja_id, cargo, data_admissao, salario_fixo, ativo, status, eh_gestor, eh_vendedor, eh_estoquista) VALUES
-- Acesso Geral
('Thiago Eduardo Almeida Coimbra', '70907427170', '90dc7c04-d4f8-4c95-82d7-13f600be4e31', 'CARGO-010', NULL, 2000, true, 'Ativo', true, false, false),
('Fellipe Timbo Martins Rodrigues', '07042087178', '90dc7c04-d4f8-4c95-82d7-13f600be4e31', 'CARGO-011', '2025-08-01', 2000, true, 'Ativo', false, false, false),
('Isaac Santos Ximenes', '07673492105', '90dc7c04-d4f8-4c95-82d7-13f600be4e31', 'CARGO-012', '2026-02-05', 2000, true, 'Ativo', false, false, false),
('Leandro de Araújo Amorim', '02866801148', '90dc7c04-d4f8-4c95-82d7-13f600be4e31', 'CARGO-001', '2025-11-15', 2000, true, 'Ativo', true, false, false),
('Matheus Mota Almeida Alves', '70775527130', '90dc7c04-d4f8-4c95-82d7-13f600be4e31', 'CARGO-001', NULL, 2000, true, 'Ativo', true, false, false),
-- Assistência - Águas Lindas
('Pedro Gabriel Marques Ferreira', '09167856101', 'f8a1eafc-b243-4e26-9494-da4a3ab8e5ad', 'CARGO-005', NULL, 2000, true, 'Ativo', false, false, false),
-- Assistência - Shopping JK
('Jeferson Sousa Cabral', '07489469180', '62730c7f-98aa-4c8a-a279-e1efec03e56f', 'CARGO-005', '2025-03-04', 2000, true, 'Ativo', false, false, false),
-- Assistência - Shopping Sul
('Gabriel Soares Lima', '02237602182', 'f2edb644-2dcb-462a-af5a-111638d05319', 'CARGO-005', '2024-12-02', 2000, true, 'Ativo', false, false, false),
-- Assistência - SIA
('Anna Beatriz Borges e Silva Vieira', '04762569178', 'd1841cc5-33e0-46e7-bd47-792f144b0d99', 'CARGO-008', '2024-10-17', 2000, true, 'Ativo', true, false, false),
('Elida França de Souza', '70312305192', 'd1841cc5-33e0-46e7-bd47-792f144b0d99', 'CARGO-004', '2025-01-09', 2000, true, 'Ativo', false, true, false),
('Julio Cesar Brandão dos Santos', '09433714148', 'd1841cc5-33e0-46e7-bd47-792f144b0d99', 'CARGO-005', NULL, 2000, true, 'Ativo', false, false, false),
('Marcos Serra de Sousa', '60899159397', 'd1841cc5-33e0-46e7-bd47-792f144b0d99', 'CARGO-005', '2023-11-23', 2000, true, 'Ativo', false, false, false),
-- Estoque - Águas Lindas Shopping
('Caio Costa dos Santos', '09253011165', '9c33d643-52dd-4134-8c91-2e01ddc05937', 'CARGO-013', NULL, 2000, true, 'Ativo', false, false, true),
('Yslana Almeida', '61432179390', '9c33d643-52dd-4134-8c91-2e01ddc05937', 'CARGO-013', '2025-06-03', 2000, true, 'Ativo', false, false, true),
-- Estoque - Shopping JK
('Jessica Mariano de Araújo', '03916632167', 'f071311a-5532-4874-bb9c-5a2e550300c8', 'CARGO-013', '2025-09-05', 2000, true, 'Ativo', false, false, true),
('Maria Luiza Souza De Araujo', '09411866107', 'f071311a-5532-4874-bb9c-5a2e550300c8', 'CARGO-013', NULL, 2000, true, 'Ativo', false, false, true),
-- Estoque - Shopping Sul
('Geisiane Borges e Silva', '00525935339', '949afa0c-6324-4a4e-ab6e-f7071fcfc3c0', 'CARGO-013', '2025-06-04', 2000, true, 'Ativo', false, false, true),
('Luana Oliveira de Castro', '04735079351', '949afa0c-6324-4a4e-ab6e-f7071fcfc3c0', 'CARGO-013', NULL, 2000, true, 'Ativo', false, false, true),
-- Estoque - SIA
('Athirson Paiva do Nascimento', '70889744106', 'fe27bdab-b6de-433c-8718-3f1690f2315d', 'CARGO-013', '2024-03-01', 2000, true, 'Ativo', false, false, true),
('Eilanne Mota Alves', '70615471110', 'fe27bdab-b6de-433c-8718-3f1690f2315d', 'CARGO-008', NULL, 2000, true, 'Ativo', true, false, false),
('Evelyn Cordeiro', '70888120109', 'fe27bdab-b6de-433c-8718-3f1690f2315d', 'CARGO-013', NULL, 2000, true, 'Ativo', false, false, true),
('Geovanna Costa dos Santos', '70559788150', 'fe27bdab-b6de-433c-8718-3f1690f2315d', 'CARGO-013', NULL, 2000, true, 'Ativo', false, false, true),
('Julio Cesar da Silva', '71394621165', 'fe27bdab-b6de-433c-8718-3f1690f2315d', 'CARGO-013', NULL, 2000, true, 'Ativo', false, false, true),
('Pedro da Silva Peres', '06994967131', 'fe27bdab-b6de-433c-8718-3f1690f2315d', 'CARGO-013', NULL, 2000, true, 'Ativo', false, false, true),
('Stephanie Vidal Sousa', '04325482113', 'fe27bdab-b6de-433c-8718-3f1690f2315d', 'CARGO-008', '2024-10-17', 2000, true, 'Ativo', true, false, false),
-- Financeiro
('Fernanda Gabrielle Silva de Lima', '07224138150', '0485360d-4e6e-458c-96a4-0e6ba6705214', 'CARGO-011', '2024-11-28', 2000, true, 'Ativo', false, false, false),
('Francilene Mota Almeida', '64667995149', '0485360d-4e6e-458c-96a4-0e6ba6705214', 'CARGO-011', '2024-11-09', 2000, true, 'Ativo', false, false, false),
('Jaciane dos Santos Barbosa Monteiro', '01773114107', '0485360d-4e6e-458c-96a4-0e6ba6705214', 'CARGO-011', '2024-12-27', 2000, true, 'Ativo', false, false, false),
('Lorranny Martins Rodrigues', '05283417158', '0485360d-4e6e-458c-96a4-0e6ba6705214', 'CARGO-008', '2024-03-01', 2000, true, 'Ativo', true, false, false),
('Maria Luiza Ribeiro Lima', '07976414160', '0485360d-4e6e-458c-96a4-0e6ba6705214', 'CARGO-011', '2025-07-15', 2000, true, 'Ativo', false, false, false),
('Paula Miceia Matias de Brito', '71376240149', '0485360d-4e6e-458c-96a4-0e6ba6705214', 'CARGO-011', NULL, 2000, true, 'Ativo', false, false, false),
-- Loja - Águas Lindas Shopping
('Gabriel Mota Monteiro', '71755558147', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Joao Marcos Silva Pereira', '71117507130', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', 'CARGO-004', '2024-02-24', 2000, true, 'Ativo', false, true, false),
('Leonardo Menezes carvalho', '70590881132', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', 'CARGO-008', '2024-11-08', 2000, true, 'Ativo', true, false, false),
('Marco Antonio Mota Alves', '70882467166', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Meline Peixoto de Almeida', '05747294105', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', 'CARGO-008', '2024-06-26', 2000, true, 'Ativo', true, false, false),
('Sarah Victoria Mota Coimbra', '71113212195', 'b2c6ac94-f08b-4c2e-955f-8a91d658d7d6', 'CARGO-004', '2024-10-17', 2000, true, 'Ativo', false, true, false),
-- Loja - Matriz
('Bruno Alves Peres', '07709100171', '6231ea0e-9ff3-4ad6-b822-6f9a8270afa6', 'CARGO-008', '2024-03-01', 2000, true, 'Ativo', true, false, false),
('Kelvin Campos Fernandes', '04633813196', '6231ea0e-9ff3-4ad6-b822-6f9a8270afa6', 'CARGO-004', '2023-11-10', 2000, true, 'Ativo', false, true, false),
('Leandro Alves dos santos', '07668235124', '6231ea0e-9ff3-4ad6-b822-6f9a8270afa6', 'CARGO-004', '2024-11-22', 2000, true, 'Ativo', false, true, false),
('Matheus Vinicius Mangolin Coimbra', '07701491546', '6231ea0e-9ff3-4ad6-b822-6f9a8270afa6', 'CARGO-004', '2024-04-16', 2000, true, 'Ativo', false, true, false),
-- Loja - Online
('Anderson das Neves Batista', '05871765122', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Antonio Sousa Silva Filho', '61578875323', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Cauã Charles Sobrinho Pereira', '71372938131', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Cauã Victor Costa dos Santos', '09253028130', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', '2024-11-21', 2000, true, 'Ativo', false, true, false),
('Izaquiel Costa Santos', '08255208194', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Laina Santos de lima', '08555138108', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-008', '2024-11-22', 2000, true, 'Ativo', true, false, false),
('Leonardo Lima Alves', '07046407169', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Marco Antonio Azevedo Leal', '70744214130', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Matheus Holanda Ribeiro da Silva', '06719854186', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-008', '2024-03-01', 2000, true, 'Ativo', true, false, false),
('Rafael Marques de Sousa', '04096462101', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Sabrina Larissa Pereira da Silva', '06666815114', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', '2024-10-01', 2000, true, 'Ativo', false, true, false),
('Suelen Franca de Souza', '70312308108', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', '2024-08-24', 2000, true, 'Ativo', false, true, false),
('Wender Rocha Biet', '06179608105', 'df3995f6-1da1-4661-a68f-20fb548a9468', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
-- Loja - Shopping JK
('Geane Laile Tavares Sousa', '71494533170', '9009b91c-0436-4070-9d30-670b8e6bd68e', 'CARGO-008', '2024-11-12', 2000, true, 'Ativo', true, false, false),
('Gustavo Gomes Andrade', '00000000000', '9009b91c-0436-4070-9d30-670b8e6bd68e', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Hayanne Santini', '04429820112', '9009b91c-0436-4070-9d30-670b8e6bd68e', 'CARGO-008', NULL, 2000, true, 'Ativo', true, false, false),
('Joao Vitor Neves Santos', '06879275109', '9009b91c-0436-4070-9d30-670b8e6bd68e', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Matheus Carvalho da Silva', '70893685135', '9009b91c-0436-4070-9d30-670b8e6bd68e', 'CARGO-004', '2025-04-30', 2000, true, 'Ativo', false, true, false),
('Matheus Eduardo da Silva', '05822666108', '9009b91c-0436-4070-9d30-670b8e6bd68e', 'CARGO-008', '2024-09-01', 2000, true, 'Ativo', true, false, false),
('Tamires Nunes de Oliveira', '06451493147', '9009b91c-0436-4070-9d30-670b8e6bd68e', 'CARGO-004', '2025-05-02', 2000, true, 'Ativo', false, true, false),
-- Loja - Shopping Sul
('Gustavo de Sousa dos Santos', '06794622106', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Leticia Ferreira de Araujo', '05855259196', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
('Patrycia Marques de Souza', '05913538145', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', 'CARGO-008', '2024-12-23', 2000, true, 'Ativo', true, false, false),
('Priscila Ketley Silva Costa', '06825964186', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', 'CARGO-004', '2024-10-17', 2000, true, 'Ativo', false, true, false),
('Wender Vinicius Maia Lima', '05434818164', '0fc4a1f3-9cd6-4e24-b0b5-7a6af4953fad', 'CARGO-004', NULL, 2000, true, 'Ativo', false, true, false),
-- Marketing
('Kellen Cavalcante Valverde', '71165644118', '0296bdea-88df-4c32-be31-cc0e5cabc495', 'CARGO-014', '2025-04-29', 2000, true, 'Ativo', false, false, false),
('Rian Gabriel Pimentel da silva', '07576240148', '0296bdea-88df-4c32-be31-cc0e5cabc495', 'CARGO-014', '2025-04-29', 2000, true, 'Ativo', false, false, false),
('Roberto Guedes de Andrade', '05566366198', '0296bdea-88df-4c32-be31-cc0e5cabc495', 'CARGO-014', NULL, 2000, true, 'Ativo', false, false, false),
-- Motoboy
('Athirson de Moraes Marques', '00000000000', 'dcec4eec-2817-49cc-940b-57e7cb097b85', 'CARGO-009', NULL, 2000, true, 'Ativo', false, false, false),
('Joao Vitor Rezende Andrade de Souza', '04563446165', 'dcec4eec-2817-49cc-940b-57e7cb097b85', 'CARGO-009', NULL, 2000, true, 'Ativo', false, false, false),
('Natanael Gomes da Silva', '00000000000', 'dcec4eec-2817-49cc-940b-57e7cb097b85', 'CARGO-009', NULL, 2000, true, 'Ativo', false, false, false),
('Ryan Nunes de Souza', '00000000000', 'dcec4eec-2817-49cc-940b-57e7cb097b85', 'CARGO-009', NULL, 2000, true, 'Ativo', false, false, false),
('Samuel Silva dos Santos Nonato', '05741762174', 'dcec4eec-2817-49cc-940b-57e7cb097b85', 'CARGO-009', NULL, 2000, true, 'Ativo', false, false, false),
('Iwry Almeida de Macedo', '00000000000', 'dcec4eec-2817-49cc-940b-57e7cb097b85', 'CARGO-009', NULL, 2000, true, 'Ativo', false, false, false),
('Vinício Lopes da Silva', '00000000000', 'dcec4eec-2817-49cc-940b-57e7cb097b85', 'CARGO-009', NULL, 2000, true, 'Ativo', false, false, false);