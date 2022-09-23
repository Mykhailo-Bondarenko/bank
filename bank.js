"use strict";
//* Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. Существует два типа счетов: дебетовый и кредитовый. Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. Аналогично для активных. Для получения актуальных курсов валют использовать API (которое будет предоставлено). Промисы использовать для работы с API в целях отправки запросов на сервер. Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.
const clients = [];

async function getExchangeResult() {
  return await fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
    .then(response => response.json())
    .then(data => {
      const result = {};
      for (let i = 0; i < data.length; i++) {
        result[data[i].ccy] = data[i];
      }
      result['UAH'] = { ccy: 'UAH', base_ccy: 'UAH', buy: '1.00', sale: '1.00' };
      return result;
    })
    .catch((error) => {
      throw new Error(`You have error: ${error.message}`);
    });
}

class Bank {
  constructor(clients) {
    this.clients = clients;
  }

  creditDutyAllClients() {
    return getExchangeResult()
      .then(result => {
        let debt = 0;
        for (const item of this.clients) {
          for (const account of item.creditAccount) {
            debt += ((account.limit - account.balance) / result.USD.sale)
              * result[account.currency].sale;
          }
        }
        return debt;
      });
  }

  totalFunds() {
    return getExchangeResult().then((result) => {
      let amount = 0;
      this.clients.forEach(client => {
        for (const value of [...client.creditAccount, ...client.debitAccount]) {
          amount += ((value.balance - value.limit) / result.USD.sale)
            * result[value.currency].sale;
        }
      });
      return amount;
    });
  }

  amountClientsDebtors(status) {
    let amount = 0;
    this.clients.forEach(client => {
      if (client.isActive === status) {
        for (let i = 0; i < client.creditAccount.length; i++) {
          if (client.creditAccount[i].limit > client.creditAccount[i].balance) {
            amount++;
            break;
          }
        }
      }
    });
    return amount;
  };

  sumCreditDutyClients(isActive) {
    return getExchangeResult()
      .then(result => {
        let sum = 0;
        this.clients.forEach((client => {
          if (client.isActive === isActive && client.creditAccount.length > 0) {
            client.creditAccount.forEach(value => {
              let temp = (value.limit - value.balance) / result.USD.sale;
              sum += temp * result[value.currency].sale;
            });
          }
        }));
        return sum;
      });
  };
}

class Client {
  constructor(surname, name, patronymic, isActive, id) {
    this.surname = surname;
    this.name = name;
    this.patronymic = patronymic;
    this.isActive = isActive;
    this.id = id;
    this.debitAccount = [];
    this.creditAccount = [];
    this.registrationDate = new Date().toLocaleDateString();
  }
  addDebitAccount(currency, expirationDate, balance) {
    this.debitAccount.push({ currency, expirationDate, balance, limit: 0 });
  }
  addCreditAccount(currency, expirationDate, balance, limit) {
    if (balance > limit) {
      throw new Error('Credit balance cannot exceed the limit of the card.');
    }
    this.creditAccount.push({ currency, expirationDate, balance, limit });
  }
}

const client1 = new Client('Ivanov', 'Ivan', 'Ivanovich', 'yes', 1);
client1.addDebitAccount('USD', '31.12.23', 1000);
client1.addCreditAccount('USD', '31.12.23', 250, 1000);

const client2 = new Client('Ivanov', 'Ivan', 'Ivanovich', 'no', 2);
client2.addDebitAccount('USD', '31.12.23', 2000);
client2.addCreditAccount('USD', '31.12.23', 250, 2000);

const client3 = new Client('Ivanov', 'Ivan', 'Ivanovich', 'yes', 3);
client3.addDebitAccount('USD', '31.12.23', 3000);
client3.addDebitAccount('USD', '31.12.23', 4000);
client3.addCreditAccount('USD', '31.12.23', 250, 3000);
client3.addCreditAccount('USD', '31.12.23', 250, 4000);

clients.push(client1);
clients.push(client2);
clients.push(client3);

const bank = new Bank(clients);