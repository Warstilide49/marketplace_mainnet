import * as tokens from './tokensTab'
import * as sales from './sales'
import * as auctions from './auctions'

export async function createDOM(contract, parent, current){
	let container = document.createElement('div');
	container.id = 'pagination_container'
	
	const total_elements = await getTotalElements(contract, parent);
	const total_pages = Math.ceil(total_elements/9);

	if (total_pages==0)
		current = 0

	container.innerHTML = 
		`<div style='display:flex; gap:50px; align-items:center'>
			<button id='previous_button'>< Previous </button>
			<p>Page ${current} of ${total_pages}</p>
			<button id='next_button'>Next ></button>
		</div>
		<form style='display:flex; gap:10px;'>
			<p> Go to page<p>
			<input id='page_number' type="number" required min=1 max=${total_pages} style='width:40px'>
		</form>`

	const previous = container.querySelector('#previous_button');
	if(current == 1 || current == 0)
		previous.style.display = 'none';
	previous.addEventListener('click', ()=>{
		getRedirectFunction(parent, contract, current-1)
	})

	const next = container.querySelector('#next_button');
	if(current == total_pages || current == 0)
		next.style.display = 'none';
	next.addEventListener('click', ()=>{
		getRedirectFunction(parent, contract, current+1)
	})

	const form = container.querySelector('form');
	form.addEventListener('submit', (e)=>{
		e.preventDefault()
		fromForm(parent, contract, total_pages)
	});

	parent.append(container);
}

function fromForm(parent, contract, total_pages) {
	const input = document.getElementById('page_number').value;

	if(input > total_pages){
		alert('Invalid value');
		return;
	}

	getRedirectFunction(parent, contract, input)

}

async function getTotalElements(contract, parent){
	switch(parent.id){
		case "sales" :
			return (await window.marketplace_contract.get_number_of_offers());
		case "auctions_tab" :
			return (await window.marketplace_contract.get_number_of_auctions());
		case "tokens_tab" :
			return (await contract.nft_supply_for_owner({'account_id': window.accountId}) )
	}
}

async function getRedirectFunction(parent, contract, current){
	switch(parent.id){
		case "sales" :
			sales.createDOM(current);
			break
		case "auctions_tab" :
			auctions.createDOM(current)	// TODO: setup current in auctions as well
			break
		case "tokens_tab" :
			tokens.createDOM(contract, current);
			break
	}
}