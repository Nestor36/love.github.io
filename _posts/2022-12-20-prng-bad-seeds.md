---
layout: post
title: Explotanto un PRNG bad seed
author: c4rta
date: 2022-12-20
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, bad seed]
image: /assets/img/prng/waifu.webp
---
Te mostrare como puedes abusar de la generacion de numeros aleatorios generados por la funcion rand() con el fin de predecir un numero
{:.lead}

## ¿Que es una seed?

Las "seed" o semilla en español, es un numerito inicial del generador de numeros pseudoaleatorios (PRNG), la cual es completamente determinista, es decir, que la generacion de numeros aleatorios esta determinada por la semilla y eso hace que el generador produzca la misma secuencia de numeros para un valor dado.

Esto va mas alla de hacer un simple programa en C que genere numeros random, las semillas se usan mucho en la ciberseguridad y mas que nada en la criptografia, es importante generar una buena semilla ya que si se obtiene el valor de la semilla se puede romper por completo el proceso de cifrado, parece una tonteria que con conocer un numerito se ocasiona un problema muy grave, si quieres ver ejemplos reales de una vulnerabilidad como esta puedes buscar

- CVE-2020-7010:
	La aplicación en la nube en Kubernetes genera contraseñas mediante un generador de números aleatorios débil en función del tiempo de implementación. 

- CVE-2019-11495:
	El servidor usa erlang:now() para sembrar el PRNG, lo que da como resultado un pequeño espacio de búsqueda para posibles semillas aleatorias

- CVE-2018-12520:
	El PRNG del producto no está sembrado para la generación de ID de sesión

- CVE-2016-10180:
	La generación de PIN del enrutador se basa en la siembra de rand (time(0)). 

Referencia por [MITRE](https://cwe.mitre.org/data/definitions/335.html)

## ¿Que es PRNG?

La generacion de numeros pseudoaleatorios (PRNG) es una funcion que genera numeros aleatorios dado tres estados, pongamolos que PRNG actua como una caja negra, que toma un numero (semilla) y produce una secuencia de bits, segun, se dice que esta secuencia es random si pasa una serie de pruebas estadisticas, y entonces se dice que es random, las pruebas puede ser que se mide la frecuencia de bits y secuencia de bits.

Dije que esta dado tres estados, estos son:

- **Estado de inicializacion**: El cual toma la semilla y pone al generador en su estado inicial
- **Estado de transicion**: Transforma el estado del generador tomando en cuenta la semilla
- **Estado de salida**: Transforma el estado actual para producir un numero fijo de bits

Para que quede mas claro veamos lo siguiente:

Se obtiene una secuencia de bits pseudoaleatoria el cual es puesta en el generador usando la semilla (primer estado), y poniendo al generador a llamar a la funcion de transicion repetidamente (segundo estado) y por ultimo se produce una salida de bits aleatorios (tercer estado)

![](/assets/img/prng/prng.png)

## Explotando un PRNG bad seed

Usare el ejemplo mas simple que pude encontrar, es de la pagina pwnable.kr y el problema se llama "random", te puedes contectar usando SSH ```ssh random@pwnable.kr -p2222``` pw:guest

Este es el codigo del archivo ejecutable:
```c
#include <stdio.h>

int main(){
	unsigned int random;
	random = rand();	// valor random

	unsigned int key=0;
	scanf("%d", &key);

	if( (key ^ random) == 0xdeadbeef ){
		printf("Good!\n");
		system("/bin/cat flag");
		return 0;
	}

	printf("Wrong, maybe you should try 2^32 cases.\n");
	return 0;
}
```
Y como extra la pista que nos dejan es: ```¡Papi, enséñame a usar valores aleatorios en la programación!```

El programa es muy simple acepta la entrada de números enteros y lo compara con 0xdeadbeef y, si el valor coincide, debe mostrar la flag

El programa usa la función rand() para generar un valor aleatorio. La función rand() devuelve un número pseudoaleatorio, rand es inseguro para generar números aleatorios. Los números que genera son predecibles cuando la semilla no es dada para el rand. Entonces  si la semilla se establece en 1, el generador se reinicializa a su valor inicial y produce los mismos valores

### ¿Que significa "key ^ random"?

Esta es la pieza clave del programa, el símbolo ^ es el operador XOR en C. XOR es el equivalente a "o", que significa "uno o el otro, pero no ambos", con esto que tenemos hasta ahora se puede podemos generar una ecuacion que es ```random ^ 0xdeadbeef = key```, esta ecuacion nos permite resolver ```key```

### ¿Entonces que debemos de hacer?

Para poder resolverlo debemos de hacer de que ```key ^ random``` sea igual a ```0xdeadbeef``` y para eso debemos de encontrar la manera de predecir el valor generado de la funcion rand() y luego revertir la operacion haciendo XORing el valor de rand() con 0xdeadbeef. Que genial, ¿No? ^-^ 

## Explotando el binario

Como primer paso generaremos un numero aleatorio con rand en otro programa

```c
#include <stdio.h>

void main() {
    printf("%d\n", rand());
}
```
Una vez ejecutandolo nos dara este numero ```1804289383``` y nuestra ecuacion queda asi ```1804289383 ^ 0xdeadbeef = key```

Como segundo paso vamos hacer XORing con ```0xdeadbeef```

Yo lo hare abriendo el interprete de python e ingresare ```1804289383 ^ 0xdeadbeef```, esto nos dara algo como esto ```3039230856```, y ese valor es el numero que le pasaremos al programa

```bash
random@pwnable:~$ ./random 
3039230856
Good!
Mommy, I thought libc random is unpredictable...
```
Y listo, hemos resuelto el ejercicio y la flag es: ```Mommy, I thought libc random is unpredictable... (Mami, pensé que libc random era impredecible...)``` 

Eso ha sido todo, gracias por leer ❤
