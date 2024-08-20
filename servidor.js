var express = require('express');
var pg = require('pg');

var sw = express();

sw.use(express.json());

sw.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
});

const config = {
    host: 'localhost',
    user: 'postgres',
    database: 'db_cs_2024',
    password: 'postgres',
    port: 5432
};

const postgres = new pg.Pool(config);

sw.get('/', (req, res) => {
    res.send('hello, world! meu primeiro teste. #####');
})

sw.get('/teste', (req, res) => {
    res.send('teste');
})

sw.get('/listenderecos', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select codigo as ID, complemento as Complemento, cep as CEP, nicknamejogador as Jogador from tb_endereco order by codigo asc';

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log('retornou 400 no listendereco');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                }
            });
        }
    });
});


sw.get('/listtestes', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select tb_endereco.codigo, tb_jogador.nickname as Nickname, tb_endereco.cep as CEP, tb_endereco.complemento as Complemento from tb_jogador, tb_endereco where tb_endereco.nicknamejogador = tb_jogador.nickname order by tb_endereco.codigo asc';

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log('retornou 400 no listteste');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                }
            });
        }
    });
});


sw.get('/listpatentes', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select codigo as id, nome, quant_min_pontos, to_char(datacriacao, \'dd/mm/yyyy hh24:mm:ss\') as DataCriacao, cor, logotipo from tb_patente order by codigo asc';

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log('retornou 400 no listpatente');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                }
            });
        }
    });
});


sw.get('/listjogadores', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q = 'select j.nickname, j.senha, 0 as patentes, j.quantpontos, e.complemento as Complemento, e.cep as CEP, j.quantdinheiro, to_char(j.datacadastro, \'dd/mm/yyyy hh24:mm:ss\') as datacadastro, to_char(j.data_ultimo_login, \'dd/mm/yyyy hh24:mm:ss\') as data_ultimo_login, j.situacao from tb_jogador j, tb_endereco e where e.nicknamejogador = j.nickname order by nickname asc;';

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no listjogadores');
                    console.log(err);

                    res.status(400).send('{' + err + '}');
                } else {
                    for (var i = 0; i < result.rows.length; i++) {
                        try {
                            pj = await client.query('select p.codigo, p.nome from tb_patente p, tb_jogador_conquista_patente jp where jp.codpatente=p.codigo and jp.nickname = $1', [result.rows[i].nickname])
                            result.rows[i].patentes = pj.rows;
                        } catch (err) {
                            res.status(400).send('{' + err + '}');
                        }

                    }
                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                    done(); // closing the connection;

                }
            });
        }
    });
});

sw.post('/insertpatentes', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text: "insert into tb_patente(nome, quant_min_pontos, datacriacao, cor, logotipo) values ($1, $2, now(), $3, $4) returning codigo, nome, quant_min_pontos, to_char(datacriacao, \'dd/mm/yyyy hh24:mi:ss'\), cor, logotipo;",

                values: [req.body.nome,
                req.body.quant_min_pontos,
                req.body.cor, req.body.logotipo]
            }
            console.log(q1)

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    console.log('retornou 201 no insertpatente');
                    res.status(201).send({"codigo":result1.rows[0].codigo,
                                            "nome": result1.rows[0].nome,
                                            "quant_min_pontos": result1.rows[0].quant_min_pontos,
                                            "datacriacao": result1.rows[0].datacriacao,
                                            "logotipo": result1.rows[0].logotipo});
                }

            })

        }
    })
});

sw.post('/updatepatente', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text:"update tb_patente set nome = $1, quant_min_pontos = $2, cor = $3, logotipo = $4 where codigo = $5 returning codigo, nome, quant_min_pontos, to_char(datacriacao, \'dd/mm/yyyy hh24:mi:ss'\) as datacriacao, logotipo",

                values: [req.body.nome,
                req.body.quant_min_pontos,
                req.body.cor, req.body.logotipo, req.body.codigo]
            }
            console.log(q1)

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no update q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    console.log('retornou 201 no update');
                    res.status(201).send({"codigo":result1.rows[0].codigo,
                                            "nome": result1.rows[0].nome,
                                            "quant_min_pontos": result1.rows[0].quant_min_pontos,
                                            "datacriacao": result1.rows[0].datacriacao,
                                            "logotipo": result1.rows[0].logotipo});
                }

            })

        }
    })
});

sw.get('/deletepatente/:codigo', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text:"delete from tb_patente where codigo = $1 returning codigo",
                values: [req.params.codigo]
            }
            console.log(q1)

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no update q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    console.log('retornou 201 no update');
                    res.status(201).send({ 'codigo': req.params.codigo });//retorna o codigo deletado.
                }

            })

        }
    })
});

sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000');
});