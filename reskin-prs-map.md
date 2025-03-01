# Reskin PR Map

This doc details out the order of PR's for the reskin against main.
It's crucial for the order to be followed in order to keep track of what has been tested and is still outstanding.

Full code coverage is crucial for our Withdraw release.

Below will be broken up into major sections UI section and Pages (ex FAQ, Navigation, Withdraw)
Each Section will have a link to the PR

- :x: Pending Creation
- :black_square_button: Pending Approval
- :white_check_mark: Merged
- :bangbang: Rejected

## Start

1. :black_square_button: `layout-client` [PR](https://github.com/stacks-network/sbtc-bridge/pull/104)

- Splits the layout for the app based on the /reskin route to ensure it shows the proper nav and footer down the line

2. :black_square_button: Faq: [PR](https://github.com/stacks-network/sbtc-bridge/pull/105)

- Adds the faq to be shown when a user visit /reskin

### Nav

3. :black_square_button: Navigation [PR](https://github.com/stacks-network/sbtc-bridge/pull/106)

- Add the core folder for the new reskin components
- Add the nav basics
- Allow user to connect their wallet

4. :black_square_button: Emily Limit Check, Show sBTC amount details [PR](https://github.com/stacks-network/sbtc-bridge/pull/107)

- Site should be able to get the emily cap status
- Allow user to see their sBTC amount in logged in wallet
- In Testnet link user to faucet
