import { Component, OnDestroy, OnInit } from '@angular/core';
import * as moment from 'moment';
import { ISubscription } from 'rxjs/Subscription';

import { WalletService } from '../../../../services/wallet/wallet.service';
import { HistoryService } from '../../../../services/wallet/history.service';
import { NavBarService } from '../../../../services/nav-bar.service';
import { DoubleButtonActive } from '../../../layout/double-button/double-button.component';
import { Wallet } from '../../../../app.datatypes';
import { Observable } from 'rxjs/Observable';
import { BaseCoin } from '../../../../coins/basecoin';
import { CoinService } from '../../../../services/coin.service';

@Component({
  selector: 'app-pending-transactions',
  templateUrl: './pending-transactions.component.html',
  styleUrls: ['./pending-transactions.component.scss']
})
export class PendingTransactionsComponent implements OnInit, OnDestroy {
  isLoading = false;
  transactions: any[] = [];
  currentCoin: BaseCoin;
  showError = false;

  private navbarSubscription: ISubscription;
  private coinSubscription: ISubscription;
  private dataSubscription: ISubscription;

  constructor(
    private walletService: WalletService,
    private historyService: HistoryService,
    private navbarService: NavBarService,
    private coinService: CoinService
  ) { }

  ngOnInit() {
    this.coinSubscription = this.coinService.currentCoin
      .subscribe((coin: BaseCoin) => {
        this.currentCoin = coin;
        this.navbarService.setActiveComponent();
      });

    this.navbarService.showSwitch('pending-txs.my', 'pending-txs.all', DoubleButtonActive.LeftButton);

    this.navbarSubscription = this.navbarService.activeComponent.subscribe(value => {
      this.loadTransactions(value);
    });
  }

  ngOnDestroy() {
    this.navbarSubscription.unsubscribe();
    this.coinSubscription.unsubscribe();

    this.closeDataSubscription();
    this.navbarService.hideSwitch();
  }

  private loadTransactions(value: number) {
    this.isLoading = true;
    this.transactions = [];
    this.showError = false;

    const showAllTransactions = value === DoubleButtonActive.RightButton;
    this.closeDataSubscription();
    this.dataSubscription = this.historyService.getAllPendingTransactions()
      .delay(32)
      .flatMap((transactions: any) => {
        return showAllTransactions ? Observable.of(transactions) : this.getWalletsTransactions(transactions);
      })
      .subscribe(transactions => {
        this.transactions = this.mapTransactions(transactions);
        this.isLoading = false;
      },
      () => this.showError = true);
  }

  private mapTransactions(transactions) {
    return transactions.map(transaction => {
      transaction.transaction.timestamp = moment(transaction.received).unix();
      return transaction.transaction;
    })
      .map(transaction => {
        transaction.amount = transaction.outputs
          .map(output => output.coins >= 0 ? output.coins : 0)
          .reduce((a, b) => a + parseFloat(b), 0);
        return transaction;
      });
  }

  private getWalletsTransactions(transactions: any): Observable<any> {
    if (transactions.length === 0) {
      return Observable.of([]);
    }

    const allTransactions = this.getUpdatedTransactions(transactions);

    return Observable.forkJoin(allTransactions, this.walletService.currentWallets.first(), (trans: any, wallets: Wallet[]) => {
      const walletAddresses = new Set<string>();
      wallets.forEach(wallet => {
        wallet.addresses.forEach(address => walletAddresses.add(address.address));
      });

      return trans.filter(tran =>
        tran.owner_addressses.some(address => walletAddresses.has(address)) ||
        tran.transaction.outputs.some(output => walletAddresses.has(output.dst))
      );
    });
  }

  private getUpdatedTransactions(transactions: any): Observable<any> {
    return Observable.forkJoin(transactions.map((transaction: any) => {
      return Observable.forkJoin(transaction.transaction.inputs
        .map(input => this.historyService.getTransactionDetails(input)
          .map(inputDetails => inputDetails.owner_address)))
        .map((addresses) => {
          transaction.owner_addressses = addresses;
          return transaction;
        });
    }));
  }

  private closeDataSubscription() {
    if (this.dataSubscription && !this.dataSubscription.closed) {
      this.dataSubscription.unsubscribe();
    }
  }
}
