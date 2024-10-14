---
layout: post
title: Ataque format string
author: c4rta
date: 2022-07-29
#categories: [Explotacion binaria]
tags: [Explotacion Binaria, format string]
image: /assets/img/format-string/waifu.png
comments: true
---
Aprederas lo basico de como realizar un ataque format string y lekear valores de la memoria

{:.lead}

## ¿Que es format string?

Vulnerabilidad la cual ocurre cuando los inputs de los usuarios son ejecutados y procesados como comandos por una funcion vulnerable, esto permite que se puedan lekear valores de la memoria, ejecutar codigo, u ocasionar un segmentation fault

### Funciones vulnerables

Las funciones que pueden ser vulnerables a format string son las de la familia ```printf```, aca les dejo un listado de cuales son

* printf()
* fprintf()
* sprintf()
* vprintf()
* snprintf()
* vsnprintf()
* vfprintf()
* vfprintf()

El format string o cadena de formato en español es al argumento que se le pasa a una de las funciones que pueden ser vulnerables, aca una imagen de cuales son los format string y su tipo

![](/assets/img/format-string/formatString.png)

Imagen: [https://www.tutorialspoint.com](https://www.tutorialspoint.com)

## Calling conventions

Las calling conventions describen lo siguiente:

* El orden en que se pasan los argumentos a una funcion

Hay que tomar en cuenta que en una arquitectura de 64 bits los primeros 6 argumentos se pasan los los registros ```RDI, RSI, RDX, RCX, R8, R9```, y los demas se empiezan a pasar por el stack y ese es el orden que describe las calling conventions

## Lekenado valores de la memoria

Para explicar un poco mas a detalle esto vamos a ir probando con un pequeño programa en C el cual es el siguiente

```c
#include <stdio.h>

void main(){
	char input[] = "Holi:)";
	printf(input);
}
```

El codigo lo pueden compilar como sea aun que yo lo hize de esta manera

```
gcc ejemplo.c -o ejemplo
```
Para esta primera parte el programa simplemente esta usando la funcion ```printf``` para imprimir la variable ```input``` que contiene la cadena ```Holi:)``` y si ejecutamos el programa debe de salir algo como esto:

![](/assets/img/format-string/pt1.png)

Pero que pasara si ahora yo en el ```printf``` le indico mas format string y el codigo del programa queda asi

```c
#include <stdio.h>

void main(){
        char input[] = "Holi:)";
        printf("%s %x %x %x" ,input);
}
```
Lo compilamos de la misma forma y ejecutamos

![](/assets/img/format-string/pt2.png)

**¿De donde salieron esos caracteres?**

Bueno, en la funcion ```printf``` se le estan pasando 4 format string, el primer format string que es ```%s``` que es para imprimir en string, este corresponde a la variable ```input```, pero los demas format string que son ```%x``` para imprimir un valor en su representacion en hexadecimal no corresponden a nada, entonces como no tienen nada que imprimir empiezan a buscar valores de la memoria del programa y eso es lo que imprime, entonces lo que hacen los 3 ```%x``` es buscar valores de la memoria e imprimirlos

## Resolviendo un pequeño ejercicio

El codigo es el siguiente y se compila de la misma forma que los anteriores

```c
#include <stdio.h>
#include <unistd.h>

int main() {
    int secret_num = 0x8badf00d;

    char name[64] = {0};
    read(0, name, 64);
    printf("Hello ");
    printf(name);
    printf("! You'll never get my secret!\n");
    return 0;
}
```
En el programa se esta declarando una variable llamada ```secret_num``` con el valor ```0x8badf00d``` la cual nunca se muesta en la ejecucion del programa, tambien se esta declarando un buffer llamado ```name``` en el cual se va almacenar nuestro input y posteriormente lo imprime con ```printf```

**Objetivo:** Lo que debemos de hacer para resolver este ejercicio es lekear la suficiente memoria para poder vizualizar el valor de ```secret_num```

Para la primera ejecucion del programa le pasaremos varios format string y queda asi:

![](/assets/img/format-string/format1.png)

Vemos como nos muesta varios valores de la memoria en su representacion en hexadecimal, sin embargo aun no vemos nuestro valor secreto pero ahi esta

**¿Como asi?**

Lo que pasa es que ahora debemos de empezar a jugar con los format string, si revisamos la tabla que puse al principio, hay un format string el cual es ```%l```, este format string es para imprimir un tipo de dato ```long```, entonces si ahora volvemos a ejecutar el binario pero le pasamos esto como input

```
%lx %lx %lx %lx %lx %lx %lx %lx %lx
```
Nos mostrara algo como esto

![](/assets/img/format-string/format2.png)

Vemos como la posicion numero 7 que se imprimio tiene esto ```8badf00d00000000```, el cual es nuestro numero secreto, tambien podemos mostrar directamente lo que se encuentre ahi y lo hacemos asi:

```
%7$lx
```
Lo que esta haciendo es imprimir lo que encuentre en la posicion numero 7 y nos muestra esto que es el valor secreto que buscamos

![](/assets/img/format-string/format3.png)

## Visualizandolo en radare2

Ahora pasaremos a verlo por detras con radare2, dejo al URL de su pagina para que puedan descargarlo

[https://rada.re/n/radare2.html](https://rada.re/n/radare2.html)

Ingresamos este comando para ejecutar el binario ```radare2 ./vuln```, ingresamos ```ood``` para cambiarnos a modo de lectura y escritura, ingresamos ```aaa``` para que redare analice el binario, ingresamos ```s main``` para movernos a la funcion main y por ultimo usamos ```pdf```para desensamblarla y nos muestra algo como esto

![](/assets/img/format-string/radare1.png)

Lo que hare es poner un break point en la direccion donde se hace el ```printf``` de nuestro input que es la linea que esta seleccionada, esto es para que cuando se ejecute el binario se detenga en esa parte, y el comando queda asi ```db 0x5555555551fd```, ahora pondre ```dc``` para continuar la ejecucion del binario, vemos como se queda esperando un input, en este caso yo lo puse esto:

```%lx %lx %lx %lx %lx %lx %lx %lx``` y vemos como nos arroja un mensaje que dice ```hit breakpoint at: 0x5555555551fd```, eso es por que llego a ese break point, ahora pondre ```dr``` para mostrar los registros y ```dc```para continuar con la ejecucion del programa y vemos algo como esto

![](/assets/img/format-string/radare2.png)

Esto con el fin de que vean lo que menciono de las calling conventions, vemos como los primeros 6 argumentos se pasan por los registros, y lo que estamos haciendo con los primeros ```%lx %lx %lx %lx %lx %lx %lx %lx``` de nuestro input es mostrar los valores de esos registros empezando por el ```RSI```, de hecho si vemos que lo que nos imprimio fue

```
Hello 20 0 400 400 7ffff7fcbae0 80000000c 8badf00d00000000 20786c2520786c25
```
Donde los primeros 5 valores despues del ```Hello```son los valores de los registros RSI, RDX, RCX, R8, R9 y los podemos comparar con los que nos salieron mostrando los registros con ```dr```, simplemente en nuestro input los estamos representando en hexadecimal

Tambien para completar podemos mostrar el registro ```RSP``` con el comando ```pxr @ rsp``` y esto tambien nos debe de mostar nuestro input y el valor secreto que buscamos

![](/assets/img/format-string/radare3.png)

Eso ha sido todo, gracias por leer ❤
