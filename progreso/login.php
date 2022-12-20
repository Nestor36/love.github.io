<?php

$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";
$dbname = "progreso";

$conn = mysqli_connect($dbhost, $dbuser, $dbpass, $dbname);
if(!$conn){ 
    die("no hay conexión: ".mysqli_connect_error());
}

$nombre = $_POST["data-username"];
$pass = $_POST["data-password"];

$query = mysql_query($conn, "SELECT * FROM usuarios WHERE usuario  = '".$nombre."' and password = '".$pass."'");

$nr = mysqli_num_rows($query);

if($nr == 1)
{
    echo "Bienvenido: ". $nombre;
} else if ($nr == 0)
{
    echo "No ingresó";
}

?>