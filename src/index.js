import {populateSales} from "./saleHandling.js"
import * as mint from "./mint.js"
import * as storage from "./storage.js"
import * as preview from "./preview_page.js"
import * as terms from "./terms.js"

import 'regenerator-runtime/runtime'
import { initContract, login, logout, clearContentBody, provokeLogin} from './utils'

function createHeader(){
	const header=document.createElement("div");
	header.id='header';

	let state=window.walletConnection.isSignedIn();
	
	header.innerHTML=`	<div id='name'>Ignitus Networks</div>
						<div id="tabs">
							<div class="cursor" id="home_redirect">Home</div>
							<div class="cursor" id="mint_redirect">Mint</div>
							<div class="cursor" id="sales_redirect">Sales</div>
							<div class="cursor" id="auction_redirect">Auctions</div>
							<div class="cursor" id="token_redirect">My Tokens</div>
							<div class="cursor" id="storage_redirect">Storage</div>
							<div class="cursor" id="tc_redirect" >T&C</div>
							<button id="login_button">${state ? 'Log Out' : 'Log In'}</button>
						</div>`

	let button=header.querySelector('#login_button');

	button.addEventListener('click',()=>{
		if (state){
			logout();
		}
		else{
			login();
		}
	})
	
	let homeButton=header.querySelector('#home_redirect');
	homeButton.addEventListener('click', home);
	
	let mintButton=header.querySelector('#mint_redirect');
	mintButton.addEventListener('click', mint.createDOM);

	let saleButton=header.querySelector('#sales_redirect');
	saleButton.addEventListener('click', preview.createDOM);

	let auctionButton=header.querySelector('#auction_redirect');
	auctionButton.addEventListener('click', preview.createDOM);

	let terms_and_conditions = header.querySelector('#tc_redirect');
	terms_and_conditions.addEventListener('click', terms.createDOM);

	let tokensTitle=header.querySelector('#token_redirect')
	let storageTitle=header.querySelector('#storage_redirect')
	if(!state){
		tokensTitle.style.display='none' 
		storageTitle.style.display='none' 
	}
	else{
		tokensTitle.style.display='block' 
		storageTitle.style.display='block' 
	}

	tokensTitle.addEventListener('click', preview.createDOM);
	storageTitle.addEventListener('click', storage.createDOM);


	return header;
}

function welcome(){
	const container=document.createElement("div");
	container.id="introduction";

	container.innerHTML=	`<div id='welcome_container'>
								<div id='welcome'>Welcome to our marketplace to buy, sell and discover NFTs!</div>
								<div id='subtext'>It is one of the latest NFT marketplaces around!</div>
							</div>`

	const item=document.createElement('div');

	item.innerHTML=`<img src="imgs/image_0.jpg" height=280 class='item_image'>
					<div class='item_info'>
						<div class='item_left'>
							<div class='item_owner'>An Example NFT</div>
							<div class='item_bid'>Cost: 2 units</div>
						</div>
					</div>`

	item.id='item_container';
	//createItem("imgs/image_0.jpg","An Example NFT","2 units",280,false);

	container.appendChild(item);

	return container;
}

function createBody(){
	const container=document.createElement("div");
	container.id="body_container";

	provokeLogin(container,'Please Log In with your NEAR Wallet To Buy the Nfts on Sale!');

	container.innerHTML+=`<div id="body_title">Items At Sale From Our Nft Contract!</div>
						<div id="main_sale_container"></div>`
	return container;
}

function footer(){
	const footer=document.createElement("footer");
	footer.id='footer';
	footer.innerHTML=`<div id="footer_content">Made by Ignitus Networks, powered by NEAR</div>`;
	return footer;
}

function initialSite(){

	const content=document.getElementById("content")
	content.appendChild(createHeader());
	content.appendChild(welcome());
	content.appendChild(createBody());
	content.appendChild(footer());
}

function home(){
  clearContentBody()
  let content=document.getElementById("content");
  let footer=document.getElementById("footer");

  content.insertBefore(welcome(), footer);
  content.insertBefore(createBody(), footer);

  let sales_container = document.getElementById("main_sale_container"); 
  populateSales(sales_container, window.nft_contract)
}

// Initial page

window.nearInitPromise = initContract()
							.then(initialSite)
							.then( ()=>{
								let sales_container = document.getElementById("main_sale_container");  
								populateSales(sales_container, window.nft_contract);
							});

