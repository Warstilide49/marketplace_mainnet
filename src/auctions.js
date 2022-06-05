import {clearContentBody, provokeLogin, getContract} from "./utils.js"
import {Contract} from 'near-api-js'
import * as pagination from './pagination'

const EXCEPTION = 300000000;
const NEAR_IN_YOCTO = 1000000000000000000000000;
const MIN_BID_INCREMENT = 0.01;

export async function createDOM(current=1){

	// Creating container
	let main_container=document.createElement("div")
	provokeLogin(main_container, "Please Log In with your NEAR Wallet To participate in the auction");
	
	let container=document.createElement("div")
	container.innerHTML=`<h1>Auctions</h1>
						<div id='auction_container'></div>`
	container.id='auctions_tab';
	container.classList.add('page_style')

	pagination.createDOM(null, container, current)

  main_container.append(container)
	
	// Stuff to do to change body
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()
	content.insertBefore(main_container, footer)

	// populating
	let auction_content = document.getElementById('auction_container');
  populateItems(auction_content, (current-1)*9 );
}

export async function populateItems(container, index){
	try{
		let sales=await window.marketplace_contract.get_auctions({'from_index': index.toString(), 'limit':9}); 
		
		let token_ids=sales.map(sale=>sale.token_id);

		let tokens=[];

		let contracts = sales.map(sale=>sale.nft_contract_id);
		const set = new Set();
		const contract_objects = [];

		for(let i=0;i<token_ids.length;i++){
			// Not much of a better solution tbh
			let contract = await getContract(set, contract_objects, contracts[i])
			/*let contract = await new Contract(window.walletConnection.account(), contracts[i], {
			    viewMethods: ['nft_metadata', 'nft_total_supply', 'nft_tokens_for_owner', 'nft_token'],
			    changeMethods: ['nft_mint', 'nft_transfer', 'nft_approve', 'nft_revoke'],
			})*/
		  let token = await contract.nft_token({'token_id': token_ids[i]})
		  const contract_metadata = await contract.nft_metadata();
			const base_uri = contract_metadata.base_uri;
			Object.assign(token, {base_uri});
			tokens.push(token);
		}

		createSalesDOM(sales, tokens, container)
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

function createSalesDOM(sales, tokens, container){
	container.id='items';
	container.classList.add('tokens');

	if (sales.length==0){
		container.textContent="No auctions found!"
		return;
	}

	for(let i=0;i<sales.length;i+=1){
		container.appendChild(createSaleFromObject(sales[i], tokens[i]))
	}

	return;
}

function createSaleFromObject(sale, token){

	// Finding media 
	let media = token.metadata.media;

	if(token.base_uri){
		media = token.base_uri + '/' + token.metadata.media;
	}

	// Token container
	let saleDOM=document.createElement('div')
	saleDOM.id="tokenContainer";
	saleDOM.classList.add('auction_tab_items_bg')

	let current_price=(sale.price/(10**24)).toFixed(2);
	let preface='Start Price'
	if (sale.bids.length!=0){
		current_price=(sale.bids[0].price/(10**24)).toFixed(2);
		preface='Latest Bid'
	}

	saleDOM.innerHTML=`<img class ="loading" src="imgs/img_loading.gif">
						<img src=${media} class="token_image hidden" alt='NFT'>
						<div class='item_info'>
							<div class='item_left'>
								<div class='item_owner'>${sale.owner_id}</div>
								<div class='item_bid'>${preface}: ${current_price} NEAR</div>

							</div>
							<div>
								<button id="details">Details</button>
							</div>
						</div>`;

	let [loading_img, img] = saleDOM.querySelectorAll("img")

	img.addEventListener('load', ()=>{
		loading_img.style.display='none';
		img.style.display = 'block'
	});

	img.addEventListener('error', ()=>{
		loading_img.style.display='none';
		img.src = "imgs/failed-to-load.svg"
	});
	
	let button=saleDOM.querySelector('#details');
	button.sale=sale
	button.token=token
	button.media=media
	button.addEventListener('click', openModal);

	return saleDOM;
}

function openModal(e){
	
	if(!window.walletConnection.isSignedIn()){
		alert('Please Sign In!')
		return;
	}

	let {container,modal}= createModal("token_info");
	let body=document.body;
	body.append(container);
	body.classList.add('modal-open');

	let media=e.target.media
	let title=e.target.token.metadata.title
	let description=e.target.token.metadata.description
	let tokenId=e.target.token.token_id

	let isItNew=(e.target.sale.bids.length==0);

	let current_price= isItNew ? (e.target.sale.price/(10**24)).toFixed(2) : (e.target.sale.bids[0].price/(10**24)).toFixed(2);

	let startTime=(e.target.sale.start_time/(10**6))
	startTime=new Date(startTime);

	let endTime=(e.target.sale.end_time/(10**6))
	endTime=new Date(endTime);


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
		                <div class="token_static_info">
		                	<div class='token_main_text'>Auction Info</div>
		                	<div class='token_subtext'>${isItNew ? 'Owner' : 'Current Bidder'}: ${isItNew ? e.target.sale.owner_id : e.target.sale.bids[0].bidder_id}</div>		                	
		                	<div class='token_subtext'>Current Price: ${current_price}</div>
		                	<div class='token_subtext'>Start time: ${startTime}</div>		                	
		                	<div class='token_subtext'>End time: ${endTime}</div>
		                </div>
		                <div>
		                	<div class='token_main_text'>Bid</div>
		                	<form>
		                		<input id="token_bid_price" type="number" placeholder="Enter your bid" min="0.01" step="0.01" required>
		                		<button type="submit"> Submit </button>
		                	</form>
		                </div>
		                <div>		                	
		                	<button id="end"> End Auction </button>
		                </div>
		                <button id="close_modal">Close</button>
	                </div>`

	let form=modal.querySelector('form');
	form.sale=e.target.sale
	form.token=e.target.token
	form.currentPrice=current_price
	form.addEventListener('submit', (e)=>{
		e.preventDefault()
		bid(e)
	});

	let endButton=modal.querySelector('#end');
	endButton.sale=e.target.sale;
	endButton.token=e.target.token
	endButton.addEventListener('click', end_auction);

	modal.querySelector("#close_modal").addEventListener("click", ()=>{
    	body.classList.remove('modal-open')
    	container.remove();
  	})

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

async function bid(e){
	if(!window.walletConnection.isSignedIn())
	{	alert('Please Sign In!')
		return;
	}

	if(window.accountId==e.target.sale.owner_id){
		alert('Cant bid on your own token!');
		return;
	}

	let startTime=(e.target.sale.start_time/(10**6))
	let endTime=(e.target.sale.end_time/(10**6))
	let currentTime=(new Date).getTime()

	if(currentTime < startTime){
		alert(`Auction has not begun yet, please try again at ${new Date(startTime)}`)
		return;
	}

	if(currentTime > endTime){
		alert('Auction has already ended, please end the auction.')
		return;
	}


	let bid_amount=parseFloat(document.getElementById("token_bid_price").value);

	let min_amount = parseFloat(e.target.currentPrice) + MIN_BID_INCREMENT	

	if (bid_amount < min_amount){
		alert(`Please bid higher than ${min_amount} NEAR`);
		return;
	}

	// EXCEPTION amount arises from limits of using toLocaleString which can only render accurately till 10**15. 
	bid_amount=(bid_amount*NEAR_IN_YOCTO + EXCEPTION).toLocaleString('fullwide', {useGrouping:false});

	console.log(bid_amount)

	try{
		await window.marketplace_contract.add_bid({"nft_contract_id": e.target.sale.nft_contract_id, 
		                                          "token_id":e.target.token.token_id},
		                                          "300000000000000",
		                                          bid_amount);
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

async function end_auction(e){

	let endTime=(e.target.sale.end_time/(10**6))
	let currentTime=(new Date).getTime()

	if(currentTime < endTime){
		alert(`Cannot end the auction now, please try again at ${new Date(endTime)}`)
		return;
	}

	try{
		// Ending auction, if there is a bid its transferred otherwise only the sale gets removed.
		// which is why a revoke transaction is also added to remove the approval, this is so that when the
		// auction ends with no bids, the token tab must enable to list it again.
		await window.marketplace_contract.end_auction({"nft_contract_id": e.target.sale.nft_contract_id, 
		                                          "token_id":e.target.token.token_id},
		                                          "300000000000000");
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
