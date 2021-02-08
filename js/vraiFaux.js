// - - - - - - - - - - - - - - - - - - - - - - -

// PETITE APPLI DE QUIZ MATHÉMATIQUES

// Auteur : Damien Mégy
// Domaine public

// - - - - - - V A R I A B L E S - - - - - - - - 

var etat = 'accueil';
// Variable d'état de l'application.
// Peut prendre les valeurs : 'accueil', 'chargement', 'info', 'jeu', 'resultats', 'correction', 'fin'.
// Elle détermine ce qui doit être affiché ou pas (voir le template)

var stats = {loc: {}, theme: {}, glob : {} }; // différentes contextes de stats

// pour les bonus:
var combo = 0; // barre de combo : nb de réponses correctes depuis la dernière faute
var bonus = {total:0,liste:[],html:""}; // infos sur les bonus

var nbQuestions = 4; // nb de questions à afficher dans chaque partie
var data = []; // le pointeur vers l'objet courant contenant les questions, 
var themes = []; // le tableau qui contient les thèmes
var t = {"nom":"","info":"","data":[]}; // le thème choisi
var c = "loc"; // contexte actuel d'affichage de stats, peut aussi valoir "theme", ou "glob" ?

var liste = []; // longueur nbQuestions, la liste des numéros des questions posées à chaque partie
var resultatsLoc = []; // longueur idem, valeurs 1, 0 ou -1 suivant le résultat 

var heritage = 0; // points des parties précédentes, sauvegardés dans le localStorage. 
// (Si géré par le navigateur et si les cookies ne sont pas bloqués par l'utilisateur.)
var record=0; // record de points enregistré sur le serveur. Récupéré dans un fichier texte en ajax au démarrage

var largeurVerte={"width":"0%"};
var largeurJaune={"width":"0%"};
var largeurRouge={"width":"0%"};


var listeThemes=[
	{"fichier":"quadrilateres","etiquette":"Quadrilatères","badges":[]},
	{"fichier":"calcul1","etiquette":"Calcul mental et logique","badges":[]},
	{"fichier":"fractions1","etiquette":"Fractions","badges":[]},
	{"fichier":"factorisation","etiquette":"Factorisation","badges":[]},
	{"fichier":"arithmetique1","etiquette":"Arithmétique 1","badges":[]},
	{"fichier":"systemes_lin","etiquette":"Systèmes","badges":[]},
	{"fichier":"droites","etiquette":"Droites","badges":[]},
	{"fichier":"domaines1","etiquette":"Domaines de déf°","badges":[]},
	{"fichier":"inegalites1","etiquette":"Inégalités","badges":[]},
	{"fichier":"trigo1","etiquette":"Trigo 1","badges":[]},
	{"fichier":"trigo2","etiquette":"Trigo 2","badges":[]},
	{"fichier":"derivees1","etiquette":"Dérivées 1","badges":[]},
	{"fichier":"derivees2","etiquette":"Dérivées 2","badges":[]},
	{"fichier":"complexes1","etiquette":"ℂ (forme alg)","badges":[]},
	{"fichier":"complexes2","etiquette":"ℂ (argument)","badges":[]},
	{"fichier":"equations","etiquette":"Équations","badges":[]},
	{"fichier":"recap","etiquette":"Récap","badges":[]},
	{"fichier":"complexes3","etiquette":"ℂ (module)","badges":[]},
	{"fichier":"complexes4","etiquette":"ℂ (géométrie)","badges":[]},
	{"fichier":"module_un","etiquette":"𝕌 et 𝕌<sub>n</sub>","badges":[]},
	{"fichier":"todo/rotations","Rotations","badges":[]},
	{"fichier":"implication","etiquette":"Implication","badges":[]},
	{"fichier":"predicats","etiquette":"Prédicats","badges":[]},
	{"fichier":"quantificateurs","etiquette":"Quantificateurs","badges":[]},
	{"fichier":"analyse1","etiquette":"Analyse","badges":[]},
	{"fichier":"applications1","etiquette":"Applications","badges":[]},
	{"fichier":"trigo3","etiquette":"Trigo 3","badges":[]},
	{"fichier":"trigo4","etiquette":"Trigo 4","badges":[]},
	{"fichier":"ev","etiquette":"Esp. vectoriels","badges":[]},
	{"fichier":"applications_lin","etiquette":"App. linéaires","badges":[]},
	{"fichier":"matrices","etiquette":"Matrices","badges":[]}
];


// - - - - - - F O N C T I O N S - - - - - - - - 

function afficherThemes(){
	etat="afficherThemes";
	actualiserAffichage();
	$("#themes").empty();// on vide la liste
	$("#themes").append("<h4>Liste des thèmes</h4>")
	for(var i=0;i<listeThemes.length;i++){// on reconstruit la liste, avec les badges qui ont pu changer.
		$("#themes").append('<div id="boutonTheme'+i+'" style="display:inline-block;""></div>');
		$("#boutonTheme"+i).append('<button style="white-space:nowrap" class="btn btn-primary marge" onclick="choisirTheme(&quot;'+listeThemes[i].fichier+'&quot;,&quot;'+listeThemes[i].etiquette+'&quot;)">'+listeThemes[i].etiquette+'</button>');
		//$("#boutonTheme"+i).on("click",function(){choisirTheme(listeThemes[i].fichier);});

		// on rajoute les badges avec les notes déjà obtenues sur chaque thème :
		if (typeof(Storage) !== "undefined") { // si localStorage est supporté
			if (window.localStorage.getItem(listeThemes[i].fichier) !== null) { // si la clé existe
				var biscuit = JSON.parse(localStorage.getItem(listeThemes[i].fichier));
				if(biscuit.note>=10){// affichage et coloriage de badges pour les thèmes réussis avec plus de 10/20
					$("#boutonTheme"+i).append('<span id="badge'+i+'" class="label label-notify">'+biscuit.note+'/20</span>');
					var couleur = biscuit.note == 20 ? 'DarkTurquoise'
								: biscuit.note >= 18 ? 'LimeGreen'
								: biscuit.note >= 16 ? 'YellowGreen'
								: biscuit.note >= 14 ? '#DDC000'
								: biscuit.note >= 12 ? 'Orange'
								: 'DarkOrange' ;
					$("#badge"+i).css({'background-color':couleur});
				}
			}
		}
	}
	actualiserMathJax();//latex dans les boutons ?
}


function choisirTheme(nom,etiquette){ // lorsqu'on clique sur un thème :
	nbQuestions=4; // au cas où ça a changé à la fin du thème précédent avec le reste mod 4
	if(themes[nom]==undefined){ // le thème n'est pas encore chargé
		etat="chargement";
		actualiserAffichage(); // afficher l'écran de chargement
		$.get('data/' + nom + '.json?stamp='+ (new Date()).getTime(), function (d) {//récupération json + stamp
			// création et affectation d'un objet 'theme' vide:
			themes[nom]= {"nom":nom, "info":"", "data":{},"etiquette":etiquette};
			if($.type(d[0]) === "string")
				themes[nom].info=d.splice(0,1);
			themes[nom].data=d; // remplissage avec les données:
			demarrerTheme(nom);
		},"json"); // getJSON ne marche pas, pb de callback  ?... 
	} else {// si le thème est déjà chargé :
		demarrerTheme(nom);
	}
}

function demarrerTheme(nom){
	t = JSON.parse(JSON.stringify(themes[nom])); //duplication du thème
	data=t.data; //data contient les données
	console.log("Le thème "+nom+"a pour etiquette "+t.etiquette+" et contient "+data.length+" questions");
	liste=[]; // nettoyer la liste d'un éventuel thème précédent
	stats['theme'].longueur=data.length;// longueur totale du thème
	reinitialiser(stats['theme']);
	actualiserBarres();
	
	if(t.info!=""){
		etat="info";
		actualiserAffichage();
		actualiserMathJax(); // au cas où il y a des maths dans un exemple ou dans les consignes
	} else {
		nouvellePartie();
	}
}

function nouvellePartie(){
	c="loc";
	reinitialiser(stats['loc']);
	if(nbQuestions>data.length){ // s'il reste trop peu de questions
		nbQuestions=data.length;
	}
	liste=sousListe(nbQuestions,data.length); // choisir les questions de cette partie dans le thème
	console.log('il reste '+data.length+'questions. Choix : '+liste);
	
	$('#vf tr').each(function(){ if($(this).attr('id')!='tr-modele') $(this).remove();}); // vide tout sauf le modèle
	
	for(var i=0;i<nbQuestions;i++){// attribution des id et noms aux clones
		var quest=$('#tr-modele').clone().insertAfter('#tr-modele').toggle(true);
		quest.find('.question').html(data[liste[i]].statement); // lier du latex ne passe pas bien avec l'eval
		if(data[liste[i]].comment != undefined){
			quest.find('.commentaire').html(data[liste[i]].comment);
		} else{
			quest.find('.affichageCommentaire').remove();
		}
		quest.find('input').attr('name','q'+i);
		quest.find("*[id]").andSelf().each(function() { $(this).attr("id", $(this).attr("id") + i); });
	}
	etat="jeu";
	actualiserAffichage();
	actualiserMathJax();
}

function resultats(){
	//etat="resultats"; // commenter pour version "rapide"
	resultatsLoc=[];
	for(var i=0;i<liste.length;i++){
		resultatsLoc[i]=0;
		if((data[liste[i]].answer && $('#qV'+i).is(':checked'))||(!data[liste[i]].answer && $('#qF'+i).is(':checked'))){
			resultatsLoc[i]++;
			for(item in stats) stats[item].repJustes++;
		} else if((data[liste[i]].answer && $('#qF'+i).is(':checked'))||(!data[liste[i]].answer && $('#qV'+i).is(':checked'))){
			resultatsLoc[i]--;
			for(item in stats) stats[item].repFausses++;
		} else{
			for(item in stats) stats[item].repNeutres++;
		}// "if" un peu longs à cause d'un bug de Chrome sur les attributs "checked"
	}
	if( stats.loc.repFausses==0 ){ // gestion de la barre de combo
		combo+=stats.loc.repJustes;
	} else {
		combo=0;
	}
	actualiserStats();
	actualiserBarres();
	

	// ajout des bonus:
	if( Math.floor(combo/10)>0 && stats.loc.repJustes>0 ){// pour éviter de gagner des points en ne répondant à rien
		bonus.liste.push({nom: ">"+10*Math.floor(combo/10)+" réponses sans faute", valeur:Math.floor(combo/10)});
	}
	actualiserBonus();
	correction(); // on va directement à la correction, commenter pour version lente
}

function modifier(){
	etat="jeu";
	reinitialiser(stats['loc']);
	actualiserAffichage();
}

function correction(){
	//  colorier suivant les réponses.
	for(var i=0;i<liste.length;i++){
		if(resultatsLoc[i]==0){ // pas répondu
			$('#q'+'N'+i).parent().attr('class', 'btn btn-warning');
		} else if(resultatsLoc[i]==1){ // correct
			$('#q'+(data[liste[i]].answer?'V':'F')+i).parent().attr('class', 'btn btn-success');
		} else { // incorrect
			$('#q'+(data[liste[i]].answer?'F':'V')+i).parent().attr('class', 'btn btn-danger');
		}
	}
	etat="correction";

	console.log(data);
	// enlever les questions répondues correctement
	liste.sort(function(a,b){ return b - a; }); // trier dans l'ordre décroissant pour le splice !!
	console.log("on va enlever les questions "+liste);
	for(var i=0;i<liste.length;i++){
		//if(resultatsLoc[i]==1)
			data.splice(liste[i],1); 
	}
	console.log(data);
	actualiserAffichage();
	actualiserMathJax();
}

function fin(){ // Calcul des bonus de fin et affichage des stats de fin :
	etat="fin";
	c="theme"
	if(Math.ceil(stats.theme.note)>0){
		bonus.liste.push({nom: "Bonus pour la note", valeur:Math.ceil(stats.theme.note)});// bonus égal à la note
	}
	if(Math.ceil(stats.theme.note)==20){
		bonus.liste.push({nom: "Bonus spécial 20/20", valeur:10});
	}

	actualiserBonus();
	actualiserAffichage(); // affichage des résultats

	// enregistrement des résultats en local :
	if (typeof(Storage) !== "undefined" && stats.glob.reussite>=40) {
		window.localStorage.setItem('heritage',stats.glob.points+bonus.total+heritage);
		// et aussi le thème fini, la date et la note pour le badge :
		window.localStorage.setItem(t.nom, JSON.stringify({'date':(new Date()).toLocaleDateString(),'note':stats.theme.note}));
	}

	// On envoie tout au serveur.
	// Le php se charge d'archiver ça si besoin, d'actualiser les records éventuellement ou pas
    //$.ajax({
	//	method: 'post',
	//	url: 'php/score.php',
	//	data: {
	//	  'theme' : t.nom,
	//	  'heritage' : heritage,
	//	  'record' : record,
	//	  'stats' : JSON.stringify(stats),
	//	  'bonus' : JSON.stringify(bonus)
	//	}
	//});
}





// - - - -   A C T U A L I S A T I O N   A F F I C H A G E - - - - 

function actualiserAffichage(){
	actualiserStats(); //d'abord, et ensuite, l'affichage:
	$(".sync").each(function(){
		if(typeof($(this)[$(this).data('action')])=='function'){
			$(this)[$(this).data('action')](eval($(this).data('param')));
		}// l'eval est un peu moche mais bon
	});
}
function actualiserMathJax(){
	if(typeof(MathJax)!= 'undefined') {// si MathJax est chargé, on relance le rendu
		MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	} else { // sinon, on le recharge et on relance le rendu en callback
		$.getScript('http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML', function() {
    	MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		});
	}
}
function basculerStatsGlobales(){// afficher/masquer la boite de dialogue de stats globales
	actualiserStats();
	actualiserAffichage(); // l'affichage
	$('#modalStats').modal('toggle');
}
// - - - -   A C T U A L I S A T I O N   D E   D O N N E E S  - - - - 

function actualiserStats(){
	var fin=new Date();
	for(var c in stats){// actualise tous les contextes : stats locales, du thème, et globales
		if(stats[c].rep!=stats[c].repJustes+stats[c].repFausses+stats[c].repNeutres)
			stats[c].rep=stats[c].repJustes+stats[c].repFausses+stats[c].repNeutres;
		stats[c].points=stats[c].repJustes-stats[c].repFausses; // pts gagnés
		stats[c].note=(20*stats[c].points/stats[c].rep); // calcul de la note locale avec signe
		stats[c].note=(stats[c].note<0?0:stats[c].note); // on ramène à zéro le cas échéant
		stats[c].note=Math.floor(2*stats[c].note+0.5)/2; // arrondi au demi-point le + proche
		stats[c].reussite=(stats[c].rep==0?0:100*stats[c].repJustes/stats[c].rep);//taux de réussite
		stats[c].reussite=Math.floor(stats[c].reussite); // arrondi au point le + proche
		stats[c].temps=Math.floor((fin-stats[c].debut)/1000); // temps écoulé
		stats[c].rendement= 60*stats[c].points/stats[c].temps; // points gagnés par minute
		stats[c].rendement=Math.floor(10*stats[c].rendement)/10; //arrondi
		
	}

}
function actualiserBonus(){// actualise bonus.total et bonus.html d'après la pile des derniers bonus
	bonus.html="";
	for(var i=0;i<bonus.liste.length;i++){
		bonus.total+=bonus.liste[i].valeur;
		bonus.html+="<tr><td>"+bonus.liste[i].nom+"</td><td>+ "+bonus.liste[i].valeur+"</td></tr>";
	}
	bonus.liste=[];// vide la pile de bonus
}

function actualiserBarres(){
	// actualisation des longueurs des barres de progression
	largeurVerte={'width':Math.floor(100*stats['theme'].repJustes/stats['theme'].longueur)+"%"};
	largeurJaune={'width':Math.floor(100*stats['theme'].repNeutres/stats['theme'].longueur)+"%"};
	largeurRouge={'width':Math.floor(100*stats['theme'].repFausses/stats['theme'].longueur)+"%"};

}

function reinitialiser(pp){
		pp.debut=new Date(),
		pp.repJustes=0;
		pp.repFausses=0;
		pp.repNeutres=0;
		pp.rep=0;
		pp.note=0;
		pp.reussite=0;
		pp.points=0;
		pp.temps=0;
		pp.rendement=0;
}


// - - - - - - - - - - - - - - - - - - - - - - - - -

function sousListe(a,b){
	// retourne un tableau de longueur a
	//contenant des nombres entre 0 et b-1 différents
	// (ordonnés aléatoirement)
	var r=[]; //tableau à retourner
	var tab=[]; //tableau contenant les nombres de 0 à b dans l'ordre.
	for(var i=0;i<b;i++){
		tab[i]=i;
	}
	while(r.length<a){
		r.push(tab.splice(Math.floor(Math.random()*tab.length),1)[0]);
	}
	return r;
}
// - - - - - - - - - - - - - - - - - - - - - - - - -

function demarrage(){
	etat="accueil";
	// On commence par essayer de récupérer les points éventuellement sauvegardés
	if (typeof(Storage) !== "undefined") { // si localStorage est supporté
		if (window.localStorage.getItem("heritage") !== null) { // si la clé existe
	    	heritage=parseInt(window.localStorage.getItem('heritage'),10);
	    	console.log("Points sauvegardés : "+heritage);
		}
	}
	
	for(var c in stats) { // initialisation
		reinitialiser(stats[c]);
	}

	// on récupère le record actuel, en interdisant l'utilisation du cache
	//fetch('php/record.txt?stamp='+ (new Date()).getTime())
  	//	.then(response => response.text())
  	//	.then((data) => {
	//		record=data;
	//		actualiserAffichage();// quand l'info sera arrivée
	//  })

	actualiserAffichage(); // pour afficher les points sauvegardés


	// --- FONT-AWESOME
  $("head").append($("<link rel='stylesheet' href='http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css' type='text/css' media='screen' />"));
	// --- MATHJAX
	$('#accueil').append('<span id="secret" style="visibility:hidden">Test MathJax: $\\int_{\\mathbb R} e^{-x^2} dx = \\sqrt\\pi$.<br></span>'); // formule mathématique invisible
	actualiserMathJax(); //chargement et rendu du test invisible
	// --- compteur (masqué) :
	$('#secret').append('<img src="php/compteur.php" width="2" height="2">');
}