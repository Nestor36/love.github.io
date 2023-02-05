<?php



error_reporting(0);

$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";
$dbname = "progreso";

$conn = mysqli_connect($dbhost, $dbuser, $dbpass, $dbname);
if(!$conn){ die("no hay conexión: ".mysqli_connect_error());}

$nombre = $_POST["datausername"];
$pass = $_POST["datapassword"];

$query = mysqli_query($conn, "SELECT * FROM usuarios WHERE usuario  = '".$nombre."' and password = '".$pass."'");

$nr = mysqli_num_rows($query);

if($nr == 1)
{
    echo "Bienvenido: ". $nombre;
    echo "<br><a href='logout.php'>salir</a>";
} else if ($nr == 0)
{
    header("Location: index.php?error=1");
    
}




/*
if(isset($_GET["fallo"]) && $_GET["fallo"] == 'true')
{
   $msg = "<div style='color:red' align='center'>Usuario o contraseña incorrecta </div>";
}
else{
    $msg = "";
}

*/
?>