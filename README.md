# ✈️ JUSTWEAIR, 당신의 여행의 첫 시작을 우리(WE)와 함께..

1. [프로젝트 소개](#about-🎯)
2. [프로젝트 회고](#review-📚)
3. [기억하고 싶은 CODE](#code-⚒️)

<br>

## ABOUT 🎯

제주항공 웹사이트를 모티브로한 항공권 예약 사이트 개발

### 담당 API

- 소셜 로그인 및 사용자 정보 업데이트
- 주문 내역 저장 및 조회
- 결제 정보 저장 (토스 API)
- 티켓 정보 email 발송

<br>

## REVIEW 📚

프로젝트 개요 및 Sprint별 상세 회고는 `Velog`에 작성해 뒀습니다. 또한, 최종 프로젝트 결과물은 `프로젝트 시연 영상`에서 확인할 수 있습니다.

1. [Sprint1 회고](https://velog.io/@seoya_lee/Project2-JUST-WE-AIR-Sprint-1-%ED%9A%8C%EA%B3%A0)

2. [Sprint 2 회고](https://velog.io/@seoya_lee/Project-02-JUSTWEAIR-Sprint-2-%ED%9A%8C%EA%B3%A0)

3. [팀 노션 페이지](https://www.notion.so/55df994935a747258acdb229ff41b7cd?v=b8afae1ca7a74690a1d053f0753526fe)

4. [프로젝트 시연 영상](https://youtu.be/s5yfkdGG1gI)

<br>
<br>

## CODE ⚒️

이번 프로젝트에서는 담당했던 API가 많다. 그 중에서 3가지 기억하고 싶은 로직, 코드 들을 기록해보려고 합니다.

<br>

### 1. 로그인 및 사용자 업데이트 API 로직

카카오 API를 통해 받은 데이터와 DB에 있는 회원을 비교해서 회원인 경우 서비스를 이용하게 되며, 없는 경우 회원 정보 업데이트를 진행하게 된다. 프론트는 백엔드에서 보낸 response에 따라 랜더링 페이지를 달리하게 된다.

이때 고민 했던 부분은 `response 데이터를 어떻게 전달해야 프론트에서 두 경우를 식별 할 수 있을까?` 였다.

<br>

#### 첫 시도 😐

처음에는 경우의 수에 따라 return 값을 다르게 줘야한다고 생각했다. 또한, 로그인에 성공했을 때만 accessToken을 발급하는 로직을 만들었다. 이 경우, 사용자의 정보를 업데이트 한 후에 다시 로그인을 하고, accessToken을 발급 받아야 한다.

멘토님께서 코드 리뷰를 하시며 위의 방법으로는 사용자가 서비스 이용 중간에 탈주할 수도 있다고 말씀하셨고 이를 해결하기 위한 고민을 해보라고 하셨다.

<br>

#### 최종 로직 🔥

그 결과, 아래와 같은 로직을 구현할 수 있었다.

```jsx
// services/userService.js

const isUser = await userDao.getUserByKakaoId(kakaoId);
let needUpdateUserProfile = false;

if (!isUser) {
  await userDao.storeKakaoId(kakaoId);
  needUpdateUserProfile = true;
}

const user = await userDao.getUserByKakaoId(kakaoId);

if (!user.email) {
  needUpdateUserProfile = true;
}

const payLoad = {
  userId: user.id,
  expiresIn: process.env.JWT_EXPIRES_IN,
};

const accessToken = jwt.sign(payLoad, secretKey);

return {
  accessToken: accessToken,
  needUpdateUserProfile: needUpdateUserProfile,
};
```

프론트에서는 `needUpdateUserProfile` 이라는 변수의 True/False값을 통해 랜더링 페이지를 구별 할 수 있게 된다. 또한, 모든 케이스에 accessToken을 부여함으로 회원 정보 업데이트 이후에 바로 예약페이지로 넘겨주며 서비스의 연동성을 높였다. 중간 이탈자가 생기는 것을 방지하기 위함!

<br>
<br>

### 2. Transaction : 데이터 한 번에 저장하기

FE에게 대량의 데이터를 한 번에 받아오고, 여러 Table에 데이터를 동시에 저장 혹은 업데이트를 해야하는 API가 필요했다. 이를 처리하기 위해 `Transaction`을 활용했다.

트랜잭션은 여러 쿼리를 논리적으로 하나의 작업으로 묶어주고, 데이터베이스의 상태를 변화시키는 작업 단위를 뜻한다.

```jsx
// models/orderDao.js

const orderInfoTransaction = async (
  orderId,
  ticket_option_id,
  first_name,
  last_name,
  birth,
  gender,
  mobile_number,
  email,
  ticketNumber
) => {
  return await appDataSource.transaction(async (transactionalEntityManager) => {
    await transactionalEntityManager.query(
      `INSERT INTO passengers(
        first_name,
        last_name,
        birth,
        gender,
        mobile_number,
        email
      ) VALUES (?, ?, ?, ?, ?, ?);
      `,
      [first_name, last_name, birth, gender, mobile_number, email]
    );

    const [{ passengerId }] = await transactionalEntityManager.query(
      `SELECT LAST_INSERT_ID() as passengerId`
    );

    await transactionalEntityManager.query(
      `INSERT INTO orders_tickets (
          order_id,
          ticket_option_id,
          passenger_id,
          ticket_number
      ) VALUES (?, ? , ? , ?);
      `,
      [orderId, ticket_option_id, passengerId, ticketNumber]
    );
  });
};
```

<br>

### 3. Unit Test : mocking 이 뭐길래

Unit Test의 테스트 코드를 작성하면서 `axios` 와 외부 모듈에 의존하는 부분을 처리하는 것이 어려웠다. 이를 해결하는 기법이 `mocking` 이다.

카카오 API를 연동하는 부분에서 axios를 사용했는데, 모듈 전체를 mock 하는 `jest.mock()` 함수를 사용해 axios의 모든 모듈을 mock 했다.

```jsx
// test/users.test.js

const axios = require("axios");
jest.mock("axios");

// 카카오 소셜 로그인
  test("SUCCESS : kakao sign-in", async () => {
    await appDataSource.query(
      `INSERT INTO users (kakao_id, first_name, last_name, birth, mobile_number,email)
        VALUES (12345, "John", "Doe", 19991231, "01045678932", "john12@gmail.com" )`
    );

    axios.mockReturnValue(
      Promise.resolve({
        data: {
          id: 12345,
          kakao_account: {
            email: "young@gmail.com",
            profile: {
              nickname: "영",
              profile_image_url: "image.jpg",
            },
          },
        },
      })
    );
```

<br>

두 번째로, `LoginRequired`라는 모듈 전체를 mock해서 사용 했다. 이후 mockImplementation 함수를 사용해서 모의 객체를 생성해서 작성해 테스트의 효용성을 높였다.

```jsx
// test/users.test.js

const { loginRequired } = require("../utils/auth");
jest.mock("../utils/auth", () => ({ loginRequired: jest.fn() }));

test("SUCCESS : Updated user info", async () => {
  await appDataSource.query(
    `INSERT INTO users (kakao_id)
      VALUES (12345)`
  );

  loginRequired.mockImplementation((req, res, next) => {
    req.user = 1;
    next();
  });
  ...
)
```
