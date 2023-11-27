---
layout: post
title: picoCTF - Hurry up! Wait!
author: c4rta
date: 2022-07-29
##categories: [Reversing]
tags: [Reversing]
image: /assets/img/picoCTF-hurry/waifu.jpg
---
{:.lead}

## Sacando informacion del binario

![](/assets/img/picoCTF-hurry/file.png)

Lo primero que vemos a la hora de descargar el binario de la pagina de picoCTF es un binario con el nombre ```svchost.exe```, con ese nombre uno pensaria que es un binario .exe para ser ejecutado en Windows, pero no, usando el comando ```file svchost.exe```, podemos ver algo como esto:

```
svchost.exe: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, BuildID[sha1]=dea7ec3bad6aeab52804d2a614b132f4af2a1025, stripped
```
Donde dice que es un binario ELF de 64 bits y tambien vemos que el binario esta ```stripped```, un binario que esta ```stripped``` es por que se eliminaron los simbolos de depuracion (debugging symbols) y por consecuencia hace que sea mas dificil hacerle reversing, tambien obtuvimos su hash SHA1 ```dea7ec3bad6aeab52804d2a614b132f4af2a1025```, ahora si pasaremos al debugging.

## Debugging al binario con radare2.

Para comenzar con el debugging ingresamos el siguiente comando ```radare2 ./svchost.exe```, posteriormente analizamos el binario con el comando ```aaa```, nos movemos el main con ```s main``` y por ultimo mostramos el main con ```pdf``` y nos muestra todo esto

![](/assets/img/picoCTF-hurry/radare1.png)

La primera cosa interasante la vemos en esta linea:
```
lea rax, str._ada_main      ; 0x2ad8 ; "_ada_main"
```
La cual vemos una funcion con el nombre ```_ada_main```, asi que haciendo una busqueda rapida en google por el nombre de ```Ada```, me mostro que es un lenguaje de programacion, asi que el binario esta escrito en ```Ada```, seguimos viendo el codigo y llegamos a esta parte:

![](/assets/img/picoCTF-hurry/radare2.png)

Primeramente con ```call``` se hace el llamado a una funcion llamada ```sym.imp.__gnat_initialize```, sin embargo eso no es de nuestro interes ya que seguramente es una funcion incorporada en ```Ada```, abajo de esa tenemos una funcion llamada ```fcn.00001d7c``` y mostrando su contenido con ```pdf @ fcn.00001d7c``` y vemos esto

![](/assets/img/picoCTF-hurry/radare3.png)

Y tampoco nos interesa ya que es una funcion de inicializacion, pasaremos a ver la funcion que sigue la cual es ```fcn.0000298a``` de igual manera mostramos su contenido con ```pdf @ fcn.0000298a``` y vemos esto

![](/assets/img/picoCTF-hurry/radare4.png)

Aqui si ya nos interesa, podemos ver que primeramente se hace el llamado de una funcion llamada ```sym.imp.ada__calendar__delays__delay_for``` la cual es para poner un delay en el programa, esa funcion esta recibiendo un parametro asi que vamos a imprimir su contenido y vemos esto:

![](/assets/img/picoCTF-hurry/radare5.png)

Podemos ver en las partes comentadas del codigo que el argumento que recibe es ```v\x1b```, investigando un poco esto es igual a ```1000000000000000```, es absurdamente demasiado tiempo asi que si ejecutamos el programa se quedara en el delay hasta que podamos ver algo.

Ahora podemos seguir viendo las demas funciones, y la que sigue es ```fcn.00002616```, mostraremos su contenido con ```pdf @ fcn.00002616```

![](/assets/img/picoCTF-hurry/radare6.png)

Aqui si ya vemos lo mero bueno asi empezare analizando desde aqui:

![](/assets/img/picoCTF-hurry/radare7.png)

**¿Por que es tan importante esta parte**

Primeramente podemos ver en un comentario la siguiente cadena ```pqrstuvwxyzCTF_{}```, con ver el ```CTF_{}``` ya me doy una idea de que es una parte de la flag, sin embargo lo mas interesante esta en estas instrucciones:

```
lea rax, [0x00002cd8]
lea rdx, [0x00002cb8]
mov rcx, rax
mov rbx, rdx
mov rax, rdx
mov rdi, rcx
mov rsi, rax
```

* Primero: con ```lea rdx, [0x00002cd8]``` mueve la direccion ```0x00002cd8``` a rax, que seguramente esa direccion sea la de una variable y el contenido de esa direccion es ```pqrstuvwxyzCTF_{}```

* Segundo: Otra vez con ```lea rdx, [0x00002cb8]``` mueve la direccion ```0x00002cb8``` a rdx

* Tercero: mueve el contenido de rax a rcx

* Cuarto: mueve el contenido de rdx a rbx

* Quinto: mueve el contenido de rdx a rax

* Sexto: mueve el contenido de rcx a rdi

* Septimo: mueve el contenido de rax a rsi

Y esto lo que esa haciendo es tomar el primer caracter de la cadena ```pqrstuvwxyzCTF_{}``` y meterlo en la funcion ```sym.imp.ada__text_io__put__4``` que se llama en la parte de abajo.

Esto es curioso ya que esa ese caracter que mete pertenece a la flag. Pasaremos a analizar la siguiente funcion que es ```fcn.000024aa``` de igual manera mostramos su contenido

![](/assets/img/picoCTF-hurry/radare8.png)

Vemos exactamente lo mismo solo que la cadena a la cual se le esta tomando el primer caracter ahora es ```ijklmnopqrstuvwxyzCTF_{}```.

Y bueno, para no hacerlo mas largo lo que estan haciendo todas estas funciones:

```
fcn.00002616
fcn.000024aa
fcn.00002372
fcn.000025e2
fcn.00002852
fcn.00002886
fcn.000028ba
fcn.00002922
fcn.000023a6
fcn.00002136
fcn.00002206
fcn.0000230a
fcn.00002206
fcn.0000257a
fcn.000028ee
fcn.0000240e
fcn.000026e6
fcn.00002782
fcn.000028ee
fcn.000022a2
fcn.0000226e
fcn.000023da
fcn.00002206
fcn.0000230a
fcn.0000233e
fcn.00002136
fcn.00002956
```

Es guardar el primer caracter de la flag en la funcion ```sym.imp.ada__text_io__put__4```, al final la flag que me salio a mi es esta (la flag es diferente para cada usuario):

```picoCTF{d15a5m_ftw_afebc2e}```

Eso ha sido todo, gracias por leer ❤