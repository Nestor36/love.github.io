---
layout: post
title: DownUnderCTF Do The Loop - Analisis del espectrograma
author: c4rta
date: 2023-01-19
##categories: [Forense]
tags: [Explotacion Binaria, Radio Frecuencias, Espectrograma]
image: /assets/img/dooTheLoop/waifu.jpg
---
Analizaremos el espectrograma de un archivo wav en el cual descubriremos que tiene codigo morse, asi que lo desifraremos para conseguir la flag
{:.lead}

El unico archivo que se nos provee es un audio .wav, como es un desafio forense y un archivo de audio, lo que les recomiendo es

- Escucharlo
- Analizar los metadatos y aplicar esteganografia
- Analizar el archivo es un editor hexadecimal
- Analizar el espectrograma

En este ejercicio lo unico importante es el espectrograma. Podemos usar aplicaciones como ```Audacity``` o en mi caso optare por algo desde CLI, usare la herramienta sox, con el comando:

```sox forensics_do_the_loop_challenge_monorail.wav -n spectrogram```

El parametro ```-n``` nos sirve para indicar que es lo que queremos obtener de ese archivo ```wav```, asi que se le pasa ```spectrogram``` para obtener su espectro.

## Analisis del espectrograma

Como el desafio esta medio pedorro, creo que seria buena idea explicar un poco sobre los espectrogramas

### ¿Que es y como se lee el espectro?

Basicamente es la forma visual (por medio de un grafico) de representar la intensidad de la señal, la amplitud y el tiempo de un audio.

Los espectrogramas son bidimensionales, pero con una tercera dimension representada por colores. Los espectros se leen de izquierda a derecha, aun que en algunos articulos pueden referirse a "Tiempo mas antiguo(izquierda) a mas joven (derecha)".

Y hablando de colores, los colores de tonalidad azul se refieren a amplitudes bajas, y los de tonalidad mas brillante (hasta rojo) se refieren a amplitudes progresivamente mas altas o mas fuertes

Si vemos el espectro del desafio:

![](/assets/img/dooTheLoop/spectrogram.png)

Verticalmente esta la frecuencia, horizontalmente es el tiempo en segundos (duracion del audio), y la escala que esta hasta la derecha se refiere a los ```decibelios a escala completa```, simplemente es una escala que define los niveles de amplitud en decibelios en un sistema digital.

Si quieres saber a que corresponde cada numero de esa tabla puedes ver [aqui](https://www.fceia.unr.edu.ar/acustica/biblio/niveles.htm)

### Forma de onda a espectrograma

Los que trabajan con software de audio, edicion y todo ese pedo, estan acostumbrados a ver la ```forma de onda```, en la cual se representan los cambios de amplitud de una señal a lo largo del tiempo, sin embargo en un espectrograma podemos ver cambios en las frecuencias individuales de una señal, un ejemplo de forma de onda es la de nuestro desafio, simplemente podemos meterlo a software como ```Audacity```y podemos ver esto:

![](/assets/img/dooTheLoop/audacity.png)

En cambio en un espectrograma podemos ver muchas mas cosas que estan "ocultas" a simple vista en la forma de onda.

### Modulacion AM

Cuando las señales son transmitidas en banda base, osea, el receptor recibe la misma señal que anteriormente envió el emisor sin que haya sufrido ningún tipo de manipulación

La modulación es la alteración de una onda senoidal, a la que se le puede decir ```portadora```, en función de las características de otra señal, a la que se le puede decir ```mensaje```, que es la señal que contiene la información a transmitir, en la cual en esta alteracion conseguiremos obtener una nueva señal, esto lo menciono ya que en nuestro desafio hay una pequeña alteracion, la cual es el codigo morse, el cual es un metodo de comunicacion que emplea sonidos o rayos de luz a un alfabeto alfanumerico

## Resolucion del desafio

El en espectro del desafio hay codigo morse que no es perceptible al escuchar el audio y tampoco al ver la forma de onda:

![](/assets/img/dooTheLoop/codigo.png)

Aqui lo podemos ver mas claramente, asi que con un chingo de paciencia pude sacar el codigo que sale ahi, el cual es:

```
.. -.-.  --- ..- .-.. -.. .-.. .. ... - .  -.  - --- - .... .. ... --- -.  .-.. --- --- .--.  .- .-.. .-.. -.. .- -.-- 
```

Y traduciendo esto seria algo como: ```ICOULDLISTENTOTHISONLOOPALLDAY``` la cual esa es la flag

Eso ha sido todo, gracias por leer ❤
