# Instructions

La liste des raccourcis VS Code est disponible pour [MacOS](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf) ou [Windows](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf).

## Récupérer la solution via Github

Il est possible de download la solution depuis Github, ou de faire un git clone

```bash
git clone https://github.com/SoatGroup/techlab-servicefabric.git
```

## Ouvrir le dossier dans VS Code

Contenu de la solution

![](assets/01-start-solution.png)

La solution contient un dossier **LegacyApp** qui contient 2 sous-dossiers qui sont :
* **app** : qui contient le contenu de notre application
* **server** : qui contient la distribution de node.js pour Windows

Notre application node.js consite à exécuter ce code : 

```js
var express = require('express')
var feed = require('feed-read')

var url = "http://blog.soat.fr/feed/";

var port = process.env.port || 1337
var app = express(); 

app.get('/', function (req, res){
    res.writeHead(200, { 'Content-Type': 'application/json' });

    var feeder = new Promise(function(resolve, reject){
        feed(url, function (err, articles){
            if (err) {
                reject(err);
            } else {
                result = [];
                for (var i = 0; i < articles.length; i++) {
                    result.push( { title: articles[i].title, url: articles[i].url, author: articles[i].author, date: articles[i].published });
                }
                resolve(result);
            }
        });
    }).then(function (result) {
        res.write(JSON.stringify(result));
        res.end();
    });

    

});

app.listen(port);
```

## Exécuter l'application en local

Dans le terminal de VSCode, tapez la commande suivante : 

```powershell
.\LegacyApp\server\node.exe .\LegacyApp\app\server.js
```

Ouvrez votre navigateur favori à l'url : [http://localhost:1337](http://localhost:1337)

## Packager la solution pour Service Fabric

### Générer le package initial 

Lancer la commande **Service Fabric : Create Application**

![](assets/02-vscode-commands.png)

Renseignez les paramètres suivants : 
* Application Template : **azuresfguest**
* Name of your application : **Techlabs**
* Name of the application service : **LegacyApp**
* Source folder of guest binary artifacts : **LegacyApp**
* Relative path to guest binary in source folder : **server\node.exe**
* Parameters to use when calling guest binary : **app\server.js**
* Number of instances of guest binary: **-1**

Le workspace Visual Studio Code ressemble maintenant à cela :

![](assets/03-servicefabric-solution.png)

### Exposer l'application 

Dans le fichier **ServiceManifest.xml**, ajouter la variable d'environnement pour configurer le port, ainsi que l'endpoint http pour que l'application soit accessible : 

```xml
    <CodePackage Name="code" Version="1.0.0">
        <EntryPoint>
            <ExeHost>
                <Program>server\node.exe</Program>
                <Arguments>app\server.js</Arguments>
                <WorkingFolder>CodePackage</WorkingFolder>
            </ExeHost>
        </EntryPoint>
        <!-- ADD ENVIRONMENT VARIABLE -->
        <EnvironmentVariables>
            <EnvironmentVariable Name="PORT" Value="8080" />
        </EnvironmentVariables>
    </CodePackage>
    <!-- ADD ENDPOINT -->
    <Resources>
        <Endpoints>
            <Endpoint Name="NodeAppTypeEndpoint" Protocol="http" Port="8080" UriScheme="http" Type="Input" />
        </Endpoints>
    </Resources>
```

## Déployer l'application 

### Créer un party cluster

Comment créer un party cluster : [http://mfery.com/blog/start-service-fabric-with-party-cluster/](http://mfery.com/blog/start-service-fabric-with-party-cluster/)

Récapitulatif de la création : 

* Se rendre sur l'url [https://try.servicefabric.azure.com/](https://try.servicefabric.azure.com/)
* Créer un compte via Github (ou Facebook) et l'utiliser pour se connecter
* Créer un cluster **Windows**
* Télécharger le PFX
* Installer le PFX via la commande Powershell dans le répertoire ou se trouve le PFX
```powershell
$cert = Import-PfxCertificate -FilePath .\party-cluster-XXXXXXX-client-cert.pfx -CertStoreLocation Cert:\CurrentUser\My -Password (ConvertTo-SecureString 1234567890 -AsPlainText -Force)
$cert.Thumbprint | Clip
```
Lorsque vous jouerez cette commande, le thumbprint sera ajouté au presse-papiers.
Il vous sera nécessaire pour le déploiement et cela vous évitera de le chercher dans les détails des certificats.

Si toutefois, vous n'aviez pas noté le thumbprint, vous pourrez toujours le récupérer via le Manager de Certificat (command certmgr).

### Compiler l'application 

Utiliser la commande **Service Fabric: Build application** qui nous génère les fichiers **Cloud.json**, **install.ps1** et **uninstall.ps1**

![](assets/04-servicefabric-afterbuild.png)

### Configuration de déploiement

Le fichier Cloud.json contient la configuration de connexion à votre cluster.
Il faut donc y modifier le certificat, le endpoint et le port (**19000**).
```Js
{
    "ClusterConnectionParameters": {
        "ConnectionIPOrURL": "win24397l57kh8.westus.cloudapp.azure.com",
        "ConnectionPort": "19000",
        "ClientKey": "",
        "ClientCert": "",
        "ServerCertThumbprint": "84ACA5A5EC27FB486BA950DEF5744D0042745502",
        "ClientCertThumbprint": "84ACA5A5EC27FB486BA950DEF5744D0042745502"
    }
}
```

### [BONUS] Script de déploiement

Le fichier install.ps1 contient le script de déploiement.
Si vous voulez améliorer le suivi et la rapidité de déploiement vous pouvez ajouter les paramêtres **-ShowProgress -CompressPackage** à la commande **Copy-ServiceFabricApplicationPackage**.

### Vérifier votre déploiement

*Le déploiement peut prendre quelques minutes*

Allez sur l'url [https://win243b7e6lxip.westus.cloudapp.azure.com:19080/Explorer/index.html](https://win243b7e6lxip.westus.cloudapp.azure.com:19080/Explorer/index.html) (en fonction de votre cluter) afin que votre déploiement soit similaire à celui-ci : 

![](assets/05-servicefabric-result.png)

Il est possible de voir le résultat de votre application sur le site : 
[http://win243b7e6lxip.westus.cloudapp.azure.com:8080](http://win243b7e6lxip.westus.cloudapp.azure.com:8080) 

