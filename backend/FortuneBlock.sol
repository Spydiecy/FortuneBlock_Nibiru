// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FortuneBlock is ReentrancyGuard, Ownable {
    struct Lottery {
        uint256 id;
        uint256 endTime;
        uint256 prizePool;
        address[] participants;
        address winner;
        bool ended;
    }

    struct User {
        string username;
        uint256[] participatedLotteries;
        uint256[] wonLotteries;
        uint256 totalWinnings;
    }

    mapping(uint256 => Lottery) public lotteries;
    mapping(address => User) public users;
    mapping(string => address) public usernameToAddress;

    uint256 private lotteryIdCounter;
    uint256 public accumulatedCommission;

    uint256 public constant DAILY_DURATION = 1 days;
    uint256 public constant WEEKLY_DURATION = 7 days;
    uint256 public constant MONTHLY_DURATION = 30 days;
    uint256 public constant COMMISSION_RATE = 10; // 10% commission

    event UserRegistered(address indexed userAddress, string username);
    event LotteryCreated(uint256 indexed lotteryId, uint256 endTime);
    event DepositMade(uint256 indexed lotteryId, address indexed participant, uint256 amount);
    event WinnerSelected(uint256 indexed lotteryId, address indexed winner, uint256 prizeAmount);
    event LotteryRefunded(uint256 indexed lotteryId, address indexed participant, uint256 amount);
    event CommissionWithdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {
        // Initialize any other state variables here if needed
    }

    modifier onlyRegisteredUser() {
        require(bytes(users[msg.sender].username).length > 0, "User not registered");
        _;
    }

    function registerUsername(string memory _username) external {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(users[msg.sender].username).length == 0, "User already registered");
        require(usernameToAddress[_username] == address(0), "Username already taken");

        users[msg.sender].username = _username;
        usernameToAddress[_username] = msg.sender;

        emit UserRegistered(msg.sender, _username);
    }

    function createLottery(uint256 _duration) external returns (uint256) {
        require(_duration == DAILY_DURATION || _duration == WEEKLY_DURATION || _duration == MONTHLY_DURATION, "Invalid duration");

        uint256 lotteryId = lotteryIdCounter;
        lotteryIdCounter++;

        lotteries[lotteryId] = Lottery({
            id: lotteryId,
            endTime: block.timestamp + _duration,
            prizePool: 0,
            participants: new address[](0),
            winner: address(0),
            ended: false
        });

        emit LotteryCreated(lotteryId, lotteries[lotteryId].endTime);
        return lotteryId;
    }

    function deposit(uint256 _lotteryId) external payable onlyRegisteredUser nonReentrant {
        Lottery storage lottery = lotteries[_lotteryId];
        require(!lottery.ended, "Lottery has ended");
        require(block.timestamp < lottery.endTime, "Lottery has expired");
        require(msg.value > 0, "Deposit amount must be greater than 0");

        uint256 commission = (msg.value * COMMISSION_RATE) / 100;
        uint256 netDeposit = msg.value - commission;

        lottery.prizePool += netDeposit;
        accumulatedCommission += commission;

        lottery.participants.push(msg.sender);
        users[msg.sender].participatedLotteries.push(_lotteryId);

        emit DepositMade(_lotteryId, msg.sender, netDeposit);
    }

    function endLottery(uint256 _lotteryId) external nonReentrant {
        Lottery storage lottery = lotteries[_lotteryId];
        require(!lottery.ended, "Lottery has already ended");
        require(block.timestamp >= lottery.endTime, "Lottery has not yet expired");

        lottery.ended = true;

        if (lottery.participants.length <= 1) {
            // Refund if only one or no participants
            for (uint256 i = 0; i < lottery.participants.length; i++) {
                address participant = lottery.participants[i];
                uint256 refundAmount = (lottery.prizePool * 100) / (100 - COMMISSION_RATE);
                payable(participant).transfer(refundAmount);
                emit LotteryRefunded(_lotteryId, participant, refundAmount);
            }
        } else {
            // Select winner and distribute prize
            uint256 winnerIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % lottery.participants.length;
            address winner = lottery.participants[winnerIndex];
            lottery.winner = winner;

            users[winner].wonLotteries.push(_lotteryId);
            users[winner].totalWinnings += lottery.prizePool;

            payable(winner).transfer(lottery.prizePool);

            emit WinnerSelected(_lotteryId, winner, lottery.prizePool);
        }
    }

    function withdrawCommission() external onlyOwner {
        uint256 amount = accumulatedCommission;
        require(amount > 0, "No commission to withdraw");

        accumulatedCommission = 0;
        payable(owner()).transfer(amount);

        emit CommissionWithdrawn(owner(), amount);
    }

    function getUserProfile(address _userAddress) external view returns (string memory username, uint256[] memory participatedLotteries, uint256[] memory wonLotteries, uint256 totalWinnings) {
        User storage user = users[_userAddress];
        return (user.username, user.participatedLotteries, user.wonLotteries, user.totalWinnings);
    }

    function getLotteryDetails(uint256 _lotteryId) external view returns (uint256 id, uint256 endTime, uint256 prizePool, address[] memory participants, address winner, bool ended) {
        Lottery storage lottery = lotteries[_lotteryId];
        return (lottery.id, lottery.endTime, lottery.prizePool, lottery.participants, lottery.winner, lottery.ended);
    }
}