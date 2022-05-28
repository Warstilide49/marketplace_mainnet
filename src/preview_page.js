import {clearContentBody, provokeLogin} from "./utils.js"
import {Contract} from 'near-api-js'
import * as sales from "./sales.js"
import * as auctions from "./auctions.js"
import * as tokens from "./tokensTab.js"

export function createDOM(e){

	let section; // sales, auctions, your tokens
	
	switch(e.target.id){
		case "sales_redirect" :
			section = 'sales'
			break
		case "auction_redirect" :
			section = 'auctions'
			break
		case "token_redirect" :
			section = 'your tokens'
			break
	}

	// Creating container
	let main_container=document.createElement("div")
	provokeLogin(main_container, "Please Log In with your NEAR Wallet");
	
	let container=document.createElement("div")
	container.innerHTML=
		`<h1>Select Collection for viewing ${section}</h1>
		<div id='collections'></div>`

	if (section=="your tokens"){
		let addContractBlock = document.createElement('div');
		addContractBlock.id = 'add_contract_block'
		addContractBlock.innerHTML = 
			`<h2> Add Collection </h2>
			<form id='contract-form'>
				<input type="text" placeholder="Valid Contract Id" required>
				<button type="submit">Submit</button>
			</form>`

		let form = addContractBlock.querySelector('form');
		let input = addContractBlock.querySelector('input');
		form.addEventListener("submit", (e)=> {
			e.preventDefault();
			tokens.addContract(input.value)
		});
		container.append(addContractBlock)
	}

	container.id='preview_page';
	container.classList.add('page_style')

    main_container.append(container)
	
	// Stuff to do to change body
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()
	content.insertBefore(main_container, footer)

	populateCollections(section)
}

async function populateCollections(section){
	let main_container=document.getElementById('collections');
	main_container.id='items';

	try{
		let collections = await findCollection(section);		// find the contract ids list according to section
		let requiredFunction = findExitFunction(section);		// returns the relevant function where it should go

		if(collections.length==0){
			main_container.textContent = `No collection for ${section} found`;
			return;
		}
		for(let i=0; i<collections.length; i++){
			let container = await createCollectionDOM(requiredFunction, collections[i]);
			main_container.append(container);
		}

	}
	catch(e){
		alert(
		  'Something went wrong! ' +
		  'Maybe you need to sign out and back in? ' +
		  'Check your browser console for more info.'
		)
		throw e
	}
}

async function createCollectionDOM(requiredFunction, collection) {
	let container=document.createElement('div')

	let contract = await new Contract(window.walletConnection.account(), collection, {
	    viewMethods: ['nft_metadata', 'nft_total_supply', 'nft_tokens_for_owner', 'nft_token'],
	    changeMethods: ['nft_mint', 'nft_transfer', 'nft_approve', 'nft_revoke'],
	})

	let metadata = await contract.nft_metadata();

	if (!metadata.icon)
		metadata.icon = "imgs/nft_default_icon.png"

	if (requiredFunction == tokens.createDOM){
		container.id = 'token_contract_block'
		container.innerHTML =  `<div id="main_contract_content">
									<img class='cursor' height='200px' class='item_image'>
									<div class='contract_name'>${metadata.name}</div>
								</div>
								<span class="close cursor" >x</span>`

		let close_button = container.querySelector(".close");
		close_button.contract_id = collection;
		close_button.addEventListener("click", ()=>{ tokens.removeContract(collection) });
	}
	else{
		container.innerHTML=`<img class='cursor' height='200px' class='item_image'>
							<div class='contract_name'>${metadata.name}</div>`
	}

	// Defining it later cos I faced a problem with using svgs
	let img = container.querySelector('img')
	img.src= metadata.icon

	img.contract = contract;
	img.addEventListener('click', requiredFunction);

	return container;
}

async function findCollection(section) {
	let collections;
	let toDelete=[]

	if(section=="sales"){
		collections = await window.marketplace_contract.get_contract_ids();
		for(let i=0; i<collections.length; i++){
			if (await window.marketplace_contract.get_number_of_offers({nft_contract_id: collections[i]})==0){
				toDelete.push(collections[i]);
			}
		}
		while(toDelete.length>0){
			collections = collections.filter(x => x!=toDelete[0]);
			toDelete.shift()
		}
	}
	else if(section=="auctions"){
		collections = await window.marketplace_contract.get_contract_ids();
		for(let i=0; i<collections.length; i++){
			if (await window.marketplace_contract.get_number_of_auctions({nft_contract_id: collections[i]})==0){
				toDelete.push(collections[i]);
			}
		}
		while(toDelete.length>0){
			collections = collections.filter(x => x!=toDelete[0]);
			toDelete.shift()
		}
		
	}
	else if(section=='your tokens'){
		collections = await window.marketplace_contract.get_contract_ids_for_account({account_id: window.accountId});
		collections.push( window.nft_contract.contractId );
	}

	return collections
}

function findExitFunction(section){
	switch (section){
		case "sales":
			return sales.createDOM
		case "auctions":
			return auctions.createDOM
		case "your tokens":
			return tokens.createDOM
	}
}

