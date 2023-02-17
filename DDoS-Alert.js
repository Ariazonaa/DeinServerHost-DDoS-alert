const RequestDelay = 30; //in seconds
const WebHookUrl = "YOUR DISCORD WEBHOOK"; //Discord webhook
const API_REQ_IPS = ['YOUR IP']; // Server ip can whitelist via Support
const UserID = "YOUR DISCORD ID"; // Discord id for ping when DDoS 
const TOKEN = 'YOU DSH API-TOKEN'; //DeinServreHost API Token can get via Support
/////////////////////////////////////////////////////////////////
const XMLHttpRequest = require("xhr2")
const {	exec } = require("child_process");

const delay = (RequestDelay * 1000);

const APIurl = 'https://api.dsh.gg/api/v2/protection/incidents/';
var lastDDoS = [];
var thisDDoS = [];

for (i = 0; i < API_REQ_IPS.length; i++) {
	lastDDoS[i] = '';
	thisDDoS[i] = '';
}

function GetTime() {
	const today = new Date();
	if (today) {
		return today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	}
}

function sendMessage(sendthis) {
	const xhr = new XMLHttpRequest();
	xhr.open("POST", WebHookUrl, true);
	xhr.setRequestHeader('Content-type', 'application/json');
	const params = {
		content: `<@${UserID}>`,
		username: "ddos skid alert", //Webhook name
		avatar_url: 'https://cdn.discordapp.com/emojis/1043866439083380767.webp?size=96&quality=lossless', //Avatar from webhook
		embeds: [sendthis]
	}
	xhr.onload =function() {
		console.log("Send Alert!");
	}	
	xhr.send(JSON.stringify(params));	
}

function GetAllSamplePorts(t) {
	var AllPorts = [];
	var AllPortsStr = ""
	for (i = 0; i < t['samples'].length; i++) {
		if (!t['samples'][i] || !t['samples'][i]['port_dst']) {
			continue;
		} else {
			if (!AllPorts[t['samples'][i]['port_dst']]) {
				AllPorts[t['samples'][i]['port_dst']] = t['samples'][i]['port_dst'];
				AllPortsStr = AllPortsStr + " " + t['samples'][i]['port_dst'] + ", ";
			}
		}
	}
	return AllPortsStr
}

function GetAllSampleIPs(t) {
	var AllIPs = [];
	var IPsOut = "";
	for (i = 0; i < t['samples'].length; i++) {
		if (!t['samples'][i] || !t['samples'][i]['ip_src']) {
			continue;
		} else {
			if (!AllIPs[t['samples'][i]['ip_src']]) {
				AllIPs[t['samples'][i]['ip_src']] = t['samples'][i]['ip_src'];
				IPsOut = IPsOut + " `" + t['samples'][i]['ip_src'] + "`";
				if (i < t['samples'].length - 1) {
					IPsOut += ",";
				}
			}
		}
	}
	return IPsOut
}

function GetOutFromAPI(t, ipIndex) {
	if (!t) {	return }
	const out = {
		'author': {
			name: 'DDoS',
			icon_url: 'https://deinserverhost.de/assets/img/theme/penguin/server_penguin_500.png',
			url: 'https://deinserverhost.de/store/clientarea.php'
		},
		thumbnail: {
			url: 'https://tenor.com/view/hacker-typing-hacking-computer-codes-gif-17417874',
		},
		'title': "Our system has detected a DDoS (illegal traffic) and mitigation has been initiated.",
		'color': 0xFF0000,
		fields: [
                       {
                                name: 'Server',
                                value: t['ip'],
                        },
			{
				name: 'cluster',
				value: t['cluster'],
			},
			{
				name: 'GB/s',
				value: (parseInt(t['mbps']) / 1024).toFixed(3),
			},
			{
				name: 'PPS',
				value: t['pps'],
			},
			{
				name: 'method',
				value: t['method'],
			},
			{
				name: 'Destination Ports',
				value: GetAllSamplePorts(t),
			},
			{
				name: 'Attacker IPs',
				value: GetAllSampleIPs(t),
			},
		],
		timestamp: t['@_timestamp'] //new Date().toISOString(),
	}
	thisDDoS[ipIndex] = t['@_timestamp'];
	return out
}

function httpGet(url, ipIndex) {
	try {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", url, true);
		xmlHttp.setRequestHeader('X-TOKEN', TOKEN);
		xmlHttp.send();
		xmlHttp.onload = () => {
			if (xmlHttp.status != 200) {
				console.log("HTTP error: " + xmlHttp.status)
				return
			}			
			var response = xmlHttp.response;
			response = JSON.parse(response);
			if (response && response['items']) {
				console.log("totalResults: " + response['totalResults'])
				if (response['totalResults'] == 0) {
					console.log(response);
				} else {
					response = GetOutFromAPI(response['items'][response['totalResults'] - 1], ipIndex);
					console.log(thisDDoS[ipIndex] + " | " + API_REQ_IPS[ipIndex])
					if (response && lastDDoS[ipIndex] != thisDDoS[ipIndex]) {
						sendMessage(response);
						lastDDoS[ipIndex] = thisDDoS[ipIndex]
					}

				}
			}
		}
	} catch (e) {
		console.log(e)
	}
}
for (i = 0; i < API_REQ_IPS.length; i++) {
	console.log("Request for ip: " + GetTime() + " " + API_REQ_IPS[i]);

	httpGet(APIurl + API_REQ_IPS[i], i);
}

function CallItself() {
	try {
		setTimeout(function() {
			CallItself();
			for (i = 0; i < API_REQ_IPS.length; i++) {
				console.log("Request for ip: " + GetTime() + " " + API_REQ_IPS[i]);
				httpGet(APIurl + API_REQ_IPS[i], i);
			}
		}, delay);
	} catch (e) {
		console.log(e);
	}
}

CallItself();

