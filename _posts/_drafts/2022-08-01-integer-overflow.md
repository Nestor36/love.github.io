---
layout: post
title: IOF - Integer Overflow/Underflow
author: c4rta
date: 2022-08-01
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, Integer Overflow]
image: /assets/img/integer-overflow/waifu.png
---
En este post veremos como funciona y como realizar un Integer Overflow, almacenando un valor mayor del maximo soportado
{:.lead}

## Integer Overflow y underflow

Primeramente voy a explicar un poco acerca de los tipo de datos en C, pero mas que nada el maximo valor que pueden almacenar.

![](/assets/img/integer-overflow/integer.jpg)

Las variables que solo pueden almacenar valores positivos se llaman ```unsigned integers```, y las que pueden almacenar valores positivos y negativos se llaman ```signed integers```.

Es importantes tomar en cuenta el maximo valor que puede almacenar un tipo de dato int ya que cuando se intenta almacenar números negativos, el bit más significativo se usa para indicar el signo (- o +), entonces si el bit más significativo se establece en 0, la variable se vuelve positiva y si el bit mas significativo se establece en 1 se vuelve negativa, para comprender esto mejor usare una calculadora que encontre.

```https://www.simonv.fr/TypesConvert/?integers```

Para este ejercicio voy a tomar de ejemplo una variable ```signed int``` de 32 bits que su valor maximo es ```2147483647```, voy a ingresar ese valor para indicar lo que dije en el parrafo de arriba

![](/assets/img/integer-overflow/signed1.png)

Vemos como tenemos 31 bits (son 32 pero se empieza a contar desde el 0), de los cuales 30 estan prendidos, osea que su valor es ```1```, y el bit mas significativo que es el 31 se establece en ```0```, ya que ese es el que indica el signo, ahora ingresare ```2147483647``` + ```1```, osea ```2147483648```

![](/assets/img/integer-overflow/signed2.png)

Podemos ver como 30 bits estan apagados, osea en 0, y el bit mas significativo esta en ```1``` osea que el signo ahora es negativo, y si vemos la descripcion que nos pone la pagina dice que la conversion ocasiono un overflow, o un integer overflow

Entonces podemos decir que un Integer Overflow es cuando se intenta almacenar un valor mayor del maximo soportado ocasionado un Integer Overflow


### Integer Underflow

Es simplemente lo mismo solo que al reves, osea que un integer underflow se ocasiona cuando se intenta almacenar un valor menor al minimo valor admitido y el resultado se convierte en positivo

## Analizando y explotando el binario

Para este ejemplo tomare un binario de la sala pwn101 de TryHackMe ```https://tryhackme.com/room/pwn101``` el binario es del de pwn105.

Si ejecutamos el binario nos muestra algo como esto

![](/assets/img/integer-overflow/binario.png)

Simplemente se estan recibiendo dos datos de tipo int y hace la suma

Ahora metere el binario a radare2, me voy a la funcion main y pondre el comando ```VVV``` para obtener una vista por bloques

Lo primero que vemos es la declaracion de variables donde hay una que se llama ```var_ch``` que se esta declarando como ```signed int``` como se ve en la imagen de abajo.

![](/assets/img/integer-overflow/radare1.png)

Ahora me movere a la parte donde el programa tome nuestro primer input

![](/assets/img/integer-overflow/radare2.png)


Vemos que el programa guarda nuestro primer input ingresado usando ```0x0000216f```, y esto es un format string el cual es ```%d``` de igual manera arriba no los indica, de hecho esta en un comentario, entonces el binario toma nuestro input como un ```signed int```, este input lo guarda en la variable ```var_14```.

Si bajamos un poco tenemos la otra parte donde se guarda nuestro segundo input que como se puede ver es exactamente lo mismo, simplemente ahora lo guarda en una variable que se llama ```var_10```.

![](/assets/img/integer-overflow/radare3.png)

Ahora bajaremos a esta parte:

![](/assets/img/integer-overflow/radare4.png)

Lo primero que hace es mover el valor de ```var_14``` a ```edx``` y el valor de ```var_10``` a ```eax``` despues lo que hace es hacer una operacion de ```add``` osea una suma, y esta sumando el valor almacenado de nuestro primer input que esta en la variable ```var_14h``` y que se paso a ```edx``` con nuestro segundo input que esta en ```var_10h``` y que se paso de ```eax``` y el resultado lo almacena en ```var_ch```.

Despues tenemos el primer salto condicional que es ```js 0x1384``` en el cual checha si ```var_14``` tiene signo (+ o -), y en caso de que no lo tenga osea que es positivo salta a este bloque:

![](/assets/img/integer-overflow/radare5.png)

En el cual checa si nuestro segundo input que esta en ```var_10``` tiene signo (+ o -), si el resultado de esta operacion en false osea que no se cumplio la condicion y ambos valores son positivos, se salta a este bloque:

![](/assets/img/integer-overflow/radare6.png)

En el cual hace una comparacion entre el resultado de la suma de ```var_10``` y ```var_14h``` que esta almacenada en ```var_10h``` con 0, y si el resultado de la comparacion tiene signos negativos salta a este bloque:

![](/assets/img/integer-overflow/radare7.png)

En al cual basicamente esta ejecutando /bin/sh.

### ¿Como obtenemos la shell?

Si tomamos en cuenta que ```cmp``` realiza la comparacion de esta forma:

```CMP destination, source```

Lo que tenemos que hacer es almacenar un valor en nuestro primer input que sea el valor maximo de ```signed int``` ya que ```var_ch``` se esta declarando como ```signed int```, ademas de que el resultado de la suma de ```var_10``` y ```var_14h``` que se almacena en ```var_ch``` el primer numero que se le pasa es el que tiene almacenado ```var_14``` y nuestro segundo input le pondremos 1 para que el resultado sea negativo y ocasionemos un Integer Overflow

Entonces la resolucion del ejercicio queda asi:

![](/assets/img/integer-overflow/radare9.png)
