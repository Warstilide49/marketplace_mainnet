import {clearContentBody} from "./utils.js"

const GAS_FEE= `100000000000000`
const NEAR_IN_YOCTO=1000000000000000000000000;

export async function createDOM(){
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()

	let container=document.createElement("div")
	container.id="storage_tab"
	container.classList.add('page_style')
	container.innerHTML=`<h1>Storage Details</h1>`
    container.append(await storageDOM())

	content.insertBefore(container, footer)
}

async function storageDOM(){
	let container=document.createElement('div');

	let storage_balance = await giveBalance()
	container.innerHTML=`<div>
							<h2>Balance<h2>
							<div class="storage_subtext">${storage_balance}</div>
						</div>
						<div>
							<h2>Deposit<h2>
							<input id="storage_amount" type="text" placeholder="Storage Deposit in NEAR">
							<button id="storage_submit">Submit!</button>
						</div>
						<div>
							<h2>Withdraw<h2>
							<div class="storage_subtext">Click on the button below to withdraw your current storage balance</div>
							<button id="storage_withdraw">Withdraw</button>
						</div>`

	let deposit_button=container.querySelector('#storage_submit')
	deposit_button.addEventListener('click', deposit_storage)

	let withdraw_button=container.querySelector('#storage_withdraw')
	withdraw_button.addEventListener('click', withdraw_storage)

	return container
}

async function giveBalance(){
	try{
		let result= await window.marketplace_contract.storage_balance_of({"account_id":window.accountId})
		let totalSales=await window.marketplace_contract.get_supply_by_owner_id({"account_id":window.accountId})
		let minimum_balance=await window.marketplace_contract.storage_minimum_balance()
		return `${(result/10**24).toFixed(2)} NEAR out of which ${(totalSales*minimum_balance/10**24).toFixed(2)} NEAR is locked in sales.`
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

async function deposit_storage(){
	const amount=parseFloat(document.getElementById('storage_amount').value);

	if (!amount){
		alert("Please fill the field appropriately.");
		return;
	}

	if(typeof(amount)!="number")
		alert("Deposit must be a number")

	const deposit=(amount*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});

	try{
		await window.marketplace_contract.storage_deposit({},
		                                          "300000000000000",
		                                          deposit);
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

async function withdraw_storage(){
	try{
		await window.marketplace_contract.storage_withdraw({},
	                                          "300000000000000",
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