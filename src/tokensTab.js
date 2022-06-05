import {clearContentBody, provokeLogin, checkAccount, checkStandard} from "./utils.js"
import * as pagination from './pagination'

const GAS_FEE= `100000000000000`
const NEAR_IN_YOCTO=1000000000000000000000000;

export async function createDOM(contract, current=1){

	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()

	let container=document.createElement("div")
	container.id="tokens_tab"
	container.classList.add('page_style')
	container.innerHTML=`<h1>Tokens</h1>`
  container.append(await tokensDOM(contract, (current-1)*9 ))
  pagination.createDOM(contract, container, current)

	content.insertBefore(container, footer)
}

async function tokensDOM(contract, index){
	let container=document.createElement('div');
	container.id="items"
	container.classList.add('tokens');
	
	//Shows a maximum of 20 tokens. Note this
	let result= await contract.nft_tokens_for_owner({account_id:window.accountId, from_index:index.toString() ,limit:9});

	const contract_metadata = await contract.nft_metadata();
	const base_uri = contract_metadata.base_uri;

	if(result.length == 0){
		container.textContent = "No tokens found";
	}
	else{
		for (let i=0; i<result.length; i++)
			container.append(tokenFromObject(result[i], contract, base_uri));
	}

	return container
}

function tokenFromObject(tokenObject, contract, base_uri){
	let token=document.createElement('div')
	token.id = 'tokenContainer';
	token.classList.add('token_tab_items_bg');

	// Finding media 
	let media = tokenObject.metadata.media;

	if(base_uri){
		media = base_uri + '/' + tokenObject.metadata.media;
	}

	token.innerHTML=`<img class ="loading" src="imgs/img_loading.gif">
					<img class="cursor hidden token_image " src=${media} alt='NFT' >
					<div class='item_owner'>${tokenObject.metadata.title}</div>`

	let [loading_img, img] = token.querySelectorAll("img")

	img.addEventListener('load', ()=>{
		loading_img.style.display='none';
		img.style.display = 'block'
	});

	img.addEventListener('error', ()=>{
		loading_img.style.display='none';
		img.src = "imgs/failed-to-load.svg"
	});

	img.token=tokenObject
	img.contract=contract
	img.media = media
	img.addEventListener('click', tokenModalOpen)

	return token;
}

async function tokenModalOpen(e){

	let contract = e.target.contract;

	let {container,modal}= createModal("token_info");
	let body=document.body;
	body.append(container);
	body.classList.add('modal-open');

	let media=e.target.media
	let title=e.target.token.metadata.title
	let description=e.target.token.metadata.description
	let tokenId=e.target.token.token_id

	let hasOwnerListedValue=await hasOwnerListed(e.target.token, contract.contractId);

	modal.innerHTML=`<img src=${media} height="200px">
					<div style="display:flex; flex-direction:column; gap:15px">
	                	<div class="token_static_info">
		                	<div class='token_main_text'>Title</div>
		                	<div class='token_subtext'>${title}</div>
		                </div>
		                <div class="token_static_info">
		                	<div class='token_main_text'>Description</div>
		                	<div class='token_subtext'>${description}</div>
		                </div>
		                <div id="approval_section">
		                	<div class='token_main_text'>List as sale</div>
		                	<input id="token_sale_price" type="number" placeholder="Sale Price">
		                	<button id="submit_for_sale"> Submit </button>
		                </div>
		                <div id="auction_section">
		                	<div class='token_main_text'>List as auction</div>
		                	<div class='token_subtext'>(Please make sure to approve the transaction before the desired start time)</div>
		                	<form id='auction_form'>
			                	<input id="token_auction_price" type="number" placeholder="Starting Price" step=0.01 required min=0.01><br>
			                	<label class="token_subtext">Start Time:</label>
			                	<input id="token_auction_start_time" type="datetime-local" required><br>
			                	<label class="token_subtext">End Time:</label>
								<input id="token_auction_end_time" type="datetime-local" required>
								<button id="submit_for_auction" type="submit">Submit</button>
							</form>
						</div>
						<div id="remove_section" style="display:none; gap:10px;">
							<div class='token_main_text'>Remove Sale/Auction</div>
							<button id="remove_sale">Submit</button>
						</div>
		                <button id="close_modal">Close</button>
	                </div>`

	if (hasOwnerListedValue){
		modal.querySelector("#approval_section").style.display="none";
		modal.querySelector("#auction_section").style.display="none";
		modal.querySelector("#remove_section").style.display="flex";
	}
	

	modal.querySelector("#submit_for_sale").addEventListener("click", async(e)=>{

	    const sale_price=parseFloat(document.getElementById("token_sale_price").value);
	    console.log(window.marketplace_contract.accountId)
		if (!sale_price){
			alert("Please fill the fields appropriately.");
			return;
		}

		if(typeof(sale_price)!="number"){
			alert("Sale must be a number")
			return;
		}

		if(await checkStorage()){
			return;
		}

		const price=(sale_price*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});
		const is_auction=false;
		
		try {
			await contract.nft_approve({"token_id": tokenId,
			                                "account_id":window.marketplace_contract.contractId,   
			                                "msg":JSON.stringify({price,is_auction})},
			                              GAS_FEE,
			                              (NEAR_IN_YOCTO/10).toLocaleString('fullwide', {useGrouping:false}) ) ;
		} catch (e) {
			alert(
			  'Something went wrong! ' +
			  'Maybe you need to sign out and back in? ' +
			  'Check your browser console for more info.'
			)
			throw e
		}
	})

	let formElement=modal.querySelector("#auction_form")
	formElement.token=e.target.token
	formElement.contract=contract
	formElement.addEventListener('submit', add_auction);

	let removeButton=modal.querySelector("#remove_sale");
	removeButton.token=e.target.token
	removeButton.contract = contract;
	removeButton.addEventListener('click', removeSale);

	modal.querySelector("#close_modal").addEventListener("click", ()=>{
    	body.classList.remove('modal-open')
    	container.remove();
  	})

}

async function add_auction(e){
	e.preventDefault()

	let contract = e.target.contract;

	if(await checkStorage()){
		return;
	}
		
	let start_time=document.getElementById('token_auction_start_time').value;
	start_time=(new Date(start_time)).getTime();

	let end_time=document.getElementById('token_auction_end_time').value;
	end_time=(new Date(end_time)).getTime();

	// Validation
	let current_time=(new Date()).getTime();
	let limit = 0; 							//TODO: Add limit between start time and end time
	if(start_time < current_time){
		alert('Start time should be greater than current time')
		return;
	}
	if(end_time < current_time){
		alert('End time should be greater than current time')
		return;	
	}
	if(end_time < start_time + limit){
		alert('End time should be greater than start time')
		return;
	}

	start_time*=10**6
	start_time=start_time.toString()
	end_time*=10**6
	end_time=end_time.toString()

	const sale_price=parseFloat(document.getElementById("token_auction_price").value);
	const price=(sale_price*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});

	const is_auction=true;

	try{
		await contract.nft_approve({"token_id": e.target.token.token_id,
	                                "account_id":window.marketplace_contract.contractId,   
	                                "msg":JSON.stringify({price,is_auction,start_time,end_time})},
	                              GAS_FEE,
	                              (NEAR_IN_YOCTO/10).toLocaleString('fullwide', {useGrouping:false}) );	
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

async function removeSale(e){

	let contract = e.target.contract;
	try{
		await window.marketplace_contract.remove_sale({"nft_contract_id": contract.contractId, 
														"token_id": e.target.token.token_id},
														"200000000000000",
														"1");
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

async function hasOwnerListed(token, contractId) {
	try{
		let result= await window.marketplace_contract.get_sales_by_nft_contract_id({"nft_contract_id":contractId, "limit":1000})

		//For now this search will do, gotta update to binary search if it gets popular with a lot of nfts for an account
		for(let i=0;i<result.length;i++){
			if (result[i].token_id==token.token_id){
				return true;
			}
		}
		return false;
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

async function checkStorage(){
	try{
		let minimum_balance= await window.marketplace_contract.storage_minimum_balance()
		let current_storage= await window.marketplace_contract.storage_balance_of({"account_id":window.accountId})
		let totalSales=await window.marketplace_contract.get_supply_by_owner_id({"account_id":window.accountId})


		if(current_storage-minimum_balance*totalSales<=minimum_balance){
			alert('Not enough storage. Please visit the Storage section to get storage.')
			return true;
		}
		else{
			return false;
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

function createModal(modalId){
  let container=document.createElement("div");
  container.classList.add('modal_bg')

  let modal=document.createElement("div")
  modal.classList.add("modal");
  modal.id=modalId;

  container.appendChild(modal);
  return {container,modal}
}


// Contract management 

export async function addContract(contractId){

	let validAccount = await checkAccount(contractId);
	if(!validAccount){
		alert('Not valid account');
		return;
	}

	let standardContract = await checkStandard(contractId);
	if(!standardContract){
		alert('Not an nft contract OR doesn\'t follow the nft standard NEP171');
		return;	
	}
	
	try{
		await window.marketplace_contract.add_contract_for_account(	{nft_contract_id: contractId},
																		"200000000000000",
																		"1000000000000000000000");
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

export async function removeContract(contractId) {
	
	if (contractId == window.nft_contract.contractId){
		alert('Cannot remove this contract');
		return;
	}

	try{
		await window.marketplace_contract.remove_contract_for_account(	{nft_contract_id: contractId},
																		"200000000000000",
																		"1");
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
