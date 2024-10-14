---
layout: post
title: GNU Radio - Señal IQ sinusoidal
author: c4rta
date: 2023-05-02
##categories: [Radiofrecuencias]
tags: [GNU radio, Radio Frecuencias]
comments: true
image: /assets/img/GNUradio-IQ/waifu.jpg
---
Esto no tiene nada que ver con pentesting, pero mi otro gran amor son las radio comunicaciones, asi que bueno... Hoy te voy a enseñar a como generar tu primera señal IQ, donde vamos a visualizar su dominio de tiempo, dominio de frecuencia, y por ultimo vamos a identificar la señal real e imaginaria.
{:.lead}

---

Una ves que abramos el GNU radio por primera vez, nos saldran dos bloques, el primero es:

![](/assets/img/GNUradio-IQ/1.png)

Este es un bloque de opciones globales, donde se puede poner informacion acerca del ```flowgraph```, una opcion relevante es la de ```Output Lenguage```, esto es por que tenemos la posibilidad de generar un codigo en python que represetara nuestro flowgraph pero en codigo

El segundo bloque: 

![](/assets/img/GNUradio-IQ/2.png)

Es una variable, y si, en GNU radio se pueden poner variables, y tienen el mismo funcionamiento que una variable en programacion, vemos que la variable se llama ```samp_rate```, la cual nos servira para indicar el frecuencia de muestreo, la cual tiene una valor de ```32000 Hz```

Estos dos bloques son como que los que vienen por defecto, y apartir de ahora, nosotros podemos colocar mas bloques para hacer lo que queramos.

## Generando la señal

Usaremos el bloque ```Signal Source```, el cual nos va a generar una señal fuente, sin embargo, debemos de editar sus parametros, daremos doble click sobre el bloque y saldra un cuadro como este:

![](/assets/img/GNUradio-IQ/5.png)

Cuando queramos generar una señal IQ, debemos de elegir un tipo de datos complejo, y esto es por que una señal IQ se compone de dos partes: ```I``` y ```Q``` que significa, en fase y en cuadratura, que se refieren a dos sinusoides que tienen la misma frecuencia y están desfasadas a 90°, en GNU radio cuando usamos un tipo de dato complejo es por que representaremos la parte real e imaginaria de una muestra compleja, en este caso, una señal IQ sinusoidal

Otra cosa importante es la forma de onda, vemos que en nuestro ejemplo esta en ```Cosine``` o ```Seno```, osea, que vamos a generar una onda de forma ```sinusoide compleja```, y se va a generar en su forma mas simple, osea, en funcion del tiempo(t):

![](/assets/img/GNUradio-IQ/3.svg)

Solo destacare lo mas "importante", donde:

- A: es la amplitud
- ƒ: es la frecuencia de oscilacion, que seria la frecuencia de muestreo de ```32000 Hz``` que indicamos


### Throttle

Este es otro bloque:

![](/assets/img/GNUradio-IQ/6.png)

Nos sirve para limitar el numero de muestras, para que no exceda la frecuencia de muestreo indicada, si no se lo ponemos, mi computadora va a petar, y si se usara un SDR, igual petaria, asi que es importante, y en la imagen le estamos indicando que no exceda de los 32000 Hz

Este bloque va a tener dos salidas, ```Frequency Sink``` y ```Time Sink```

### Frecuency Sink

![](/assets/img/GNUradio-IQ/7.png)


Este bloque se refiere a la magnitud el espectro en el dominio de frecuencia, en el cual va a tomar un tipo de dato float complejo y va a dibujar el PSD, si vemos el resultado:

![](/assets/img/GNUradio-IQ/8.png)

Podemos ver nuestra preciosa señal en el dominio de frecuencia con un tamaño de 1Khz como le indicamos en el Signal Source, un FFT de 1024, y un ancho de banda de 32000 Hz

### Time Sink

![](/assets/img/GNUradio-IQ/9.png)

Este bloque nos permite ver el dominio de tiempo, es decir, vamos a poder ver las multiples señales a lo largo del tiempo, en este ejemplo, el numero de puntos sera la frecuencia de muestreo dada en R (1.024k).

Y da como resultado:

![](/assets/img/GNUradio-IQ/10.png)

Vemos que tenemos dos señales sinusoide complejas, una es real y una es imaginaria, es bien facil saber cual es la real, en matematicas, la funcion seno, su dominio contiene todos los reales, y su intervalo es [1, 1], donde el positivo es el seno real, si vemos de mas cerca nuestras dos señales:

![](/assets/img/GNUradio-IQ/11.png)

Podemos ver que la señal de color azul empieza en 1, entonces esa es la real, y la roja es la imaginaria

Y por ultimo, nuestro flowgraph quedo asi:

![](/assets/img/GNUradio-IQ/12.png)

Eso ha sido todo, gracias por leer, espero que te haya gustado este tema, por que seguire subiendo cosillas interesantes que se pueden hacer con GNU radio ❤
