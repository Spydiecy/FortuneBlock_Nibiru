// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FortuneBlock is ReentrancyGuard, Ownable {
    enum LotteryStatus { InProgress, Ended, Cancelled }

    struct Lottery {
        uint256 id;
        uint256 endTime;
        uint256 prizePool;
        uint256 entryFee;
        address[] participants;
        address winner;
        LotteryStatus status;
    }

    struct User {
        string username;
        uint256[] participatedLotteries;
        uint256[] wonLotteries;
        uint256 totalWinnings;
        uint256 totalParticipations;
    }

    mapping(uint256 => Lottery) public lotteries;
    mapping(address => User) public users;
    mapping(string => address) public usernameToAddress;

    uint256 private lotteryIdCounter;
    uint256 public accumulatedCommission;

    uint256 public constant COMMISSION_RATE = 10; // 10% commission
    uint256 public constant MIN_PARTICIPANTS = 2; // Minimum number of participants for a valid lottery

    event UserRegistered(address indexed userAddress, string username);
    event LotteryCreated(uint256 indexed lotteryId, uint256 endTime, uint256 entryFee);
    event DepositMade(uint256 indexed lotteryId, address indexed participant, uint256 amount);
    event WinnerSelected(uint256 indexed lotteryId, address indexed winner, uint256 prizeAmount);
    event LotteryRefunded(uint256 indexed lotteryId, address indexed participant, uint256 amount);
    event CommissionWithdrawn(address indexed owner, uint256 amount);
    event LotteryForceEnded(uint256 indexed lotteryId);
    event LotteryStatusChanged(uint256 indexed lotteryId, LotteryStatus newStatus);

    constructor() Ownable(msg.sender) {}

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

    function createLottery(uint256 _endTime, uint256 _entryFee) external onlyOwner returns (uint256) {
        require(_endTime > block.timestamp, "End time must be in the future");
        require(_entryFee > 0, "Entry fee must be greater than 0");

        uint256 lotteryId = lotteryIdCounter;
        lotteryIdCounter++;

        lotteries[lotteryId] = Lottery({
            id: lotteryId,
            endTime: _endTime,
            prizePool: 0,
            entryFee: _entryFee,
            participants: new address[](0),
            winner: address(0),
            status: LotteryStatus.InProgress
        });

        emit LotteryCreated(lotteryId, _endTime, _entryFee);
        emit LotteryStatusChanged(lotteryId, LotteryStatus.InProgress);
        return lotteryId;
    }

    function deposit(uint256 _lotteryId) external payable onlyRegisteredUser nonReentrant {
        Lottery storage lottery = lotteries[_lotteryId];
        require(lottery.status == LotteryStatus.InProgress, "Lottery is not in progress");
        require(block.timestamp < lottery.endTime, "Lottery has expired");
        require(msg.value == lottery.entryFee, "Incorrect entry fee");

        uint256 commission = (msg.value * COMMISSION_RATE) / 100;
        uint256 netDeposit = msg.value - commission;

        lottery.prizePool += netDeposit;
        accumulatedCommission += commission;

        lottery.participants.push(msg.sender);
        users[msg.sender].participatedLotteries.push(_lotteryId);
        users[msg.sender].totalParticipations++;

        emit DepositMade(_lotteryId, msg.sender, netDeposit);
    }

    function endLottery(uint256 _lotteryId) external nonReentrant {
        Lottery storage lottery = lotteries[_lotteryId];
        require(lottery.status == LotteryStatus.InProgress, "Lottery is not in progress");
        
        if (msg.sender != owner()) {
            require(block.timestamp >= lottery.endTime, "Lottery has not yet expired");
        } else {
            emit LotteryForceEnded(_lotteryId);
        }

        if (lottery.participants.length < MIN_PARTICIPANTS) {
            // Cancel and refund if not enough participants
            for (uint256 i = 0; i < lottery.participants.length; i++) {
                address participant = lottery.participants[i];
                payable(participant).transfer(lottery.entryFee);
                emit LotteryRefunded(_lotteryId, participant, lottery.entryFee);
            }
            lottery.status = LotteryStatus.Cancelled;
            emit LotteryStatusChanged(_lotteryId, LotteryStatus.Cancelled);
        } else {
            // Select winner and distribute prize
            uint256 winnerIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % lottery.participants.length;
            address winner = lottery.participants[winnerIndex];
            lottery.winner = winner;

            users[winner].wonLotteries.push(_lotteryId);
            users[winner].totalWinnings += lottery.prizePool;

            payable(winner).transfer(lottery.prizePool);

            lottery.status = LotteryStatus.Ended;
            emit LotteryStatusChanged(_lotteryId, LotteryStatus.Ended);
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

    function getUserProfile(address _userAddress) external view returns (
        string memory username,
        uint256[] memory participatedLotteries,
        uint256[] memory wonLotteries,
        uint256 totalWinnings,
        uint256 totalParticipations
    ) {
        User storage user = users[_userAddress];
        return (
            user.username,
            user.participatedLotteries,
            user.wonLotteries,
            user.totalWinnings,
            user.totalParticipations
        );
    }

    function getLotteryDetails(uint256 _lotteryId) external view returns (
        uint256 id,
        uint256 endTime,
        uint256 prizePool,
        uint256 entryFee,
        address[] memory participants,
        address winner,
        LotteryStatus status
    ) {
        Lottery storage lottery = lotteries[_lotteryId];
        return (
            lottery.id,
            lottery.endTime,
            lottery.prizePool,
            lottery.entryFee,
            lottery.participants,
            lottery.winner,
            lottery.status
        );
    }
}