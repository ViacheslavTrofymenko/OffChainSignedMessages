import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import type { Payments } from "../typechain-types";

describe("Payments", function () {
    async function deploy() {
        const [owner, receiver] = await ethers.getSigners();

        const Factory = await ethers.getContractFactory("Payments");
        const payments = await Factory.deploy({
            value: ethers.utils.parseUnits("100", "ether"),
        });

        return { owner, receiver, payments };
    }

    it("should allow to send and receive payments", async () => {
        const { owner, receiver, payments } = await loadFixture(deploy);

        const amount = ethers.utils.parseUnits("2", "ether");
        const nonce = 1;

        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256", "uint256", "address"],
            [receiver.address, amount, nonce, payments.address]
        );

        // console.log(
        //     ethers.utils.solidityKeccak256(
        //         ["string", "bytes32"],
        //         ["\x19Ethereum Signed Message:\n32", hash]
        //     )
        // );

        const messageHashBin = ethers.utils.arrayify(hash);

        // signed message
        const signature = await owner.signMessage(messageHashBin);

        console.log(signature);

        const tx = await payments
            .connect(receiver)
            .claim(amount, nonce, signature);
        await tx.wait();

        expect(tx).to.changeEtherBalance(receiver, amount);
    });
});
