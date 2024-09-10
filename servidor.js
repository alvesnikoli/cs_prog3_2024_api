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
    database: 'BD_cs_2024',
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

            var q = 'select j.nickname, j.senha, j.quantdinheiro, j.quantpontos, 0 as patentes, ' +
                    '0 as endereco,' +
                    'to_char(j.datacadastro, \'dd/mm/yyyy hh24:mm:ss\') as datacadastro,' + 
                    'to_char(j.data_ultimo_login, \'dd/mm/yyyy hh24:mm:ss\') as data_ultimo_login,' +
                    'j.situacao from tb_jogador j order by nickname asc;';

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

                            ej = await client.query('select e.codigo, e.cep, e.complemento from tb_endereco e where e.nicknamejogador= $1', [result.rows[i].nickname])
                            result.rows[i].endereco = ej.rows;
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

sw.post('/insertjogadores', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {

            var q1 = {
                text: "insert into tb_jogador(nickname, senha, quantpontos, quantdinheiro, datacadastro, data_ultimo_login, situacao)" + 
                      "values ($1, $2, $3, $4, now(), now(), $5) returning nickname, senha, quantpontos, quantpontos, quantdinheiro, to_char(datacadastro, \'dd/mm/yyyy hh24:mi:ss'\), to_char(data_ultimo_login, \'dd/mm/yyyy hh24:mi:ss'\), situacao;",

                values: [req.body.nickname,
                req.body.senha, req.body.quantpontos, req.body.quantdinheiro, req.body.situacao == true ? "A" : "I"]
            }

            var q2 = {
                text : 'insert into tb_endereco (complemento, cep, nicknamejogador) values ($1, $2, $3) returning codigo, complemento, cep;',
                values: [req.body.endereco.complemento, 
                         req.body.endereco.cep, 
                         req.body.nickname]
            }

            console.log(q1)

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{' + err + '}');
                } else {
                    
        
                    client.query(q2, async function(err,result2) {
                        if(err){
                            console.log('retornou 400 no insert q2');
                            res.status(400).send('{'+err+'}');
                        }else{
                            //insere todas as pantentes na tabela associativa.
                            for(var i=0; i < req.body.patentes.length; i++){                                              
                                try {                          
                                    pj = await client.query('insert into tb_jogador_conquista_patente (codpatente, nickname) values ($1, $2)', [req.body.patentes[i].codigo, req.body.nickname])
                                } catch (err) {
                                    res.status(400).send('{'+err+'}');
                                }                                           
                            }                            

                            done(); // closing the connection;
                            console.log('retornou 201 no insertjogador');
                            res.status(201).send({"nickname" : result1.rows[0].nickname, 
                                                  "senha": result1.rows[0].senha, 
                                                  "quantpontos": result1.rows[0].quantpontos, 
                                                  "quantdinheiro": result1.rows[0].quantdinheiro,
                                                  "situacao": result1.rows[0].situacao,
                                                  "datacadastro" : result1.rows[0].datacadastro,
                                                  "data_ultimo_login" : result1.rows[0].data_ultimo_login,
                                                  "endereco": {"codigo": result2.rows[0].codigo, "cep": result2.rows[0].cep, "complemento": result2.rows[0].complemento},
                                                  "patentes": req.body.patentes});
                        }
                    });
                }

            })

        }
    })
});

sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000');
});