// Game State Object
let gameState = {
  industry: '', // 'petroleum' | 'steel' | 'railroad'
  capital: 1000, // starting capital in $k
  integrationLevel: 0, // 0: Free Competition, 1: Cartel, 2: Syndicate, 3: Trust, 4: Consortium
  stability: 100, // Stability percentage
  scope: 'Ngang', // 'Ngang' (Horizontal) | 'Dọc' (Vertical)
  currentRound: 0,
  history: [], // [{round: 1, choice: 'A'/'B'/'C', state: {...}}]
  cartelRoundsCount: 0, // count how many rounds spent in Cartel stage
  stageGates: {
    compromisesCount: 0, // need >= 2 compromises to enter/maintain Syndicate
    distributionUnified: false, // Syndicate unified channel
    competitivePressureMet: false, // Met external crisis
    verticalScopeMet: false, // Scope is vertical
    financeCapitalMet: false // Accepted banking capital
  }
};

// Text book definitions for Stage Gates
const STAGE_DEFINITIONS = {
  1: {
    title: "Hình thành Cartel (Liên minh Giá cả)",
    icon: "🤝",
    def: "<strong>Cartel</strong> là hình thức tổ chức độc quyền vòng ngoài, lỏng lẻo nhất. Các xí nghiệp thành viên ký thỏa ước về giá cả, quy mô sản lượng, thị trường tiêu thụ... nhưng <strong>hoàn toàn độc lập cả về sản xuất lẫn lưu thông (thương mại)</strong>. Vì thế, Cartel rất dễ tan vỡ khi các thành viên lén lút bán phá giá để cạnh tranh riêng lẻ."
  },
  2: {
    title: "Nâng cấp lên Syndicate (Liên minh Lưu thông)",
    icon: "🏬",
    def: "<strong>Syndicate</strong> là hình thức độc quyền cao hơn. Các xí nghiệp thành viên <strong>mất tính độc lập về lưu thông (thương mại)</strong> - mọi việc mua nguyên liệu và bán sản phẩm đều do một Ban quản trị chung đảm nhận. Tuy nhiên, họ <strong>vẫn giữ tính độc lập về sản xuất</strong>. Hình thức này giúp tránh được việc các thành viên phản bội phá thỏa ước như ở Cartel."
  },
  3: {
    title: "Thành lập Trust (Liên minh Toàn diện)",
    icon: "🏭",
    def: "<strong>Trust</strong> là hình thức độc quyền chặt chẽ, nơi các xí nghiệp thành viên <strong>mất cả tính độc lập về sản xuất lẫn lưu thông</strong>. Toàn bộ hoạt động sáp nhập dưới một Hội đồng quản trị (Board of Trustees). Các chủ xí nghiệp cũ trở thành cổ đông nhận lợi nhuận (cổ tức) dựa trên chứng chỉ ủy thác sở hữu chứ không trực tiếp điều hành nhà máy nữa."
  },
  4: {
    title: "Vươn tới Consortium (Đế chế Tài phiệt)",
    icon: "🏦",
    def: "<strong>Consortium</strong> là hình thức độc quyền cao nhất, đa ngành và có quy mô khổng lồ. Nó kết hợp <strong>liên kết dọc</strong> (nối liền các ngành phụ trợ thô đến thành phẩm) và sự thâm nhập sâu sắc của <strong>tư bản tài chính</strong> (sự kết hợp giữa tư bản ngân hàng và tư bản công nghiệp). Tập đoàn được kiểm soát bởi các nhóm tài phiệt tài chính đứng đầu."
  }
};

// Raw Scenarios Deck generator
function getScenarios(industry) {
  // Industry specific terms
  let item = ""; // oil, steel rails, train ticket
  let raw = ""; // crude oil, iron ore, coal/steel
  let transport = ""; // pipeline, railroad ship, rail route
  let unit = ""; // gallon, ton, ticket

  if (industry === 'petroleum') {
    item = "dầu hỏa chiếu sáng";
    raw = "dầu thô";
    transport = "đường ống dẫn dầu";
    unit = "gallon";
  } else if (industry === 'steel') {
    item = "thép ray xe lửa";
    raw = "quặng sắt";
    transport = "đội tàu chở quặng";
    unit = "tấn thép";
  } else { // railroad
    item = "vé hành khách và cước vận chuyển";
    raw = "than đá nhiên liệu";
    transport = "tuyến đường sắt phụ trợ";
    unit = "lượt vận chuyển";
  }

  return [
    // ROUND 1: Price War (Free Competition -> Cartel)
    {
      round: 1,
      title: "Cuộc chiến giá cả khốc liệt",
      desc: {
        petroleum: "Các giếng khoan mới ồ ạt khai thác khiến thị trường dư thừa. Đối thủ lớn liên tục dìm giá dầu hỏa từ 30 xu xuống còn 6 xu mỗi gallon nhằm bóp chết xí nghiệp lọc dầu nhỏ của bạn.",
        steel: "Kỷ nguyên đường sắt bùng nổ, các nhà máy thép cạnh tranh điên cuồng giành hợp đồng cung cấp ray thép. Giá thép bị đối thủ dìm xuống dưới mức chi phí sản xuất thực tế.",
        railroad: "Tuyến đường sắt huyết mạch Chicago - New York chứng kiến cuộc chiến giá cước tàn khốc. Đối thủ hạ giá vé hành khách từ $20 xuống còn $1 để cướp toàn bộ lượng khách của bạn."
      }[industry],
      options: [
        {
          id: 'A',
          text: "Chấp nhận cuộc chiến, hạ giá thấp hơn nữa để loại bỏ đối thủ.",
          effect: { capital: -300, stability: 0, integrationLevel: 0, scope: "Ngang" },
          theory: "Cạnh tranh tự do giữa các xí nghiệp nhỏ dẫn đến sự phá sản của kẻ yếu và tích tụ tư bản vào tay kẻ mạnh. Tuy nhiên, nó cũng làm bạn kiệt quệ tài chính.",
          detail: "Bạn chọn tiếp tục cuộc chiến giá cả. Vốn giảm mạnh $300k. Đối thủ yếu bị đào thải nhưng bạn cũng đứng trước bờ vực suy sụp."
        },
        {
          id: 'B',
          text: "Liên hệ đối thủ, đề xuất ký hiệp ước khống chế giá bán tối thiểu và phân chia hạn ngạch bán ra.",
          effect: { capital: 100, stability: 50, integrationLevel: 1, scope: "Ngang", compromisesCount: 1 },
          theory: "Khi cạnh tranh trở nên quá khốc liệt, các xí nghiệp lớn có xu hướng thỏa hiệp với nhau thay vì tiêu diệt nhau hoàn toàn. Đây là nguyên nhân hình thành Cartel - hình thức độc quyền sơ khai nhất.",
          detail: "Hội nghị bí mật diễn ra thành công. Bạn và đối thủ thống nhất giữ giá cao. Vốn tăng $100k do biên lợi nhuận được bảo vệ. Cartel (Bậc 1) được thiết lập!"
        },
        {
          id: 'C',
          text: "Nhượng bộ thụ động, thu hẹp quy mô sản xuất và chấp nhận mất một phần lớn thị phần.",
          effect: { capital: -150, stability: 0, integrationLevel: 0, scope: "Ngang" },
          theory: "Việc không tham gia liên minh cũng không phản kháng khiến doanh nghiệp bị gạt ra lề nền kinh tế, tạo điều kiện cho các thế lực lớn tích tụ tư bản nhanh hơn.",
          detail: "Thị phần của bạn giảm nghiêm trọng. Vốn giảm $150k. Bạn vẫn ở trạng thái Cạnh Tranh Tự Do chịu sức ép."
        }
      ]
    },
    // ROUND 2: Cartel Fragility (Cartel -> Syndicate)
    {
      round: 2,
      title: "Sự phản bội trong liên minh",
      desc: {
        petroleum: `Sau vài tháng ký thỏa ước Cartel, doanh số của bạn sụt giảm do một thành viên trong liên minh bí mật chiết khấu ngầm 10% giá ${item} cho các đại lý bán buôn lớn.`,
        steel: `Hiệp ước giá thép bị lung lay dữ dội. Một nhà máy thép trong Cartel lén lút ký hợp đồng cung cấp ${item} giá rẻ cho nhà thầu dưới danh nghĩa thanh lý sản phẩm lỗi.`,
        railroad: `Thỏa ước cước vận tải bị vi phạm. Một hãng tàu đối tác ngầm hoàn tiền mặt (rebate) cho các công ty xuất khẩu lớn để thu hút lượng hàng hóa vận chuyển.`
      }[industry],
      options: [
        {
          id: 'A',
          text: "Hủy bỏ thỏa ước Cartel ngay lập tức, trả đũa bằng cuộc chiến giá tổng lực trên thị trường.",
          effect: { capital: -200, stability: 0, integrationLevel: 0, scope: "Ngang" },
          theory: "Cartel là một liên minh vô cùng lỏng lẻo. Do độc lập về sản xuất và bán hàng, các thành viên luôn có động cơ phản bội để chiếm lĩnh thị trường khi có cơ hội.",
          detail: "Thỏa ước đổ vỡ hoàn toàn. Thị trường quay lại thời kỳ hỗn loạn của tự do cạnh tranh. Vốn của bạn giảm thêm $200k."
        },
        {
          id: 'B',
          text: "Đề xuất lập một Văn phòng giao dịch chung, buộc mọi thành viên phải bán hàng và thu mua nguyên liệu qua đây.",
          effect: { capital: 150, stability: 70, integrationLevel: 2, scope: "Ngang", compromisesCount: 1 },
          gateCheck: function() {
            // Cartel -> Syndicate requires compromises >= 2
            // Let's count compromises: if they compromised in round 1 (Option B), this choice will be their 2nd compromise.
            // If they didn't compromise in round 1, they don't have enough compromise base!
            if (gameState.stageGates.compromisesCount < 1) {
              return {
                allowed: false,
                msg: "Thất bại: Bạn chưa thiết lập đủ lòng tin và mối liên hệ kinh tế với đối thủ (cần ít nhất 2 lần thỏa hiệp thành công) để họ đồng ý bàn giao quyền phân phối cho một văn phòng đại diện chung. Hãy thỏa hiệp để củng cố vị thế trước."
              };
            }
            return { allowed: true };
          },
          theory: "Syndicate giải quyết điểm yếu của Cartel bằng cách tước bỏ quyền độc lập lưu thông của các thành viên. Mọi hoạt động mua bán do văn phòng chung điều phối, trong khi sản xuất vẫn độc lập.",
          detail: "Văn phòng chung được thành lập. Các hành vi bán phá giá lén lút bị triệt tiêu hoàn toàn. Nâng cấp thành công lên Syndicate (Bậc 2)! Vốn +$150k."
        },
        {
          id: 'C',
          text: "Bỏ qua vụ phá giá, đề xuất họp lại để ký thỏa ước cam kết chặt chẽ hơn và nâng mức tiền phạt.",
          effect: { capital: 50, stability: 30, integrationLevel: 1, scope: "Ngang", compromisesCount: 1 },
          theory: "Việc duy trì Cartel mà không có công cụ chế tài lưu thông chỉ mang tính tạm thời. Độ bền liên minh sẽ tiếp tục suy giảm do lòng tin đã mất.",
          detail: "Mặc dù ký thỏa ước mới và Vốn tăng nhẹ $50k nhờ ổn định ngắn hạn, độ bền liên minh giảm mạnh xuống 30% do nguy cơ phản bội vẫn hiện hữu."
        }
      ]
    },
    // ROUND 3: Circulation control (Syndicate -> Trust)
    {
      round: 3,
      title: "Khủng hoảng nguồn nguyên liệu thô",
      desc: {
        petroleum: `Các giếng dầu nhỏ lẻ liên tục đầu cơ nâng giá ${raw}, trong khi văn phòng Syndicate của bạn gặp khó khăn do chi phí vận tải đường sắt tăng cao khiến biên lợi nhuận thu hẹp.`,
        steel: `Các mỏ ${raw} tăng giá bán vô tội vạ. Đồng thời, nhu cầu thép tăng cao nhưng các xí nghiệp thành viên trong Syndicate sản xuất manh mún, không đồng bộ chất lượng.`,
        railroad: `Giá ${raw} (nhiên liệu chạy tàu) tăng vọt. Các hãng tàu thành viên trong Syndicate tranh giành nhau nguồn than đá chất lượng cao, gây mất đoàn kết nội bộ.`
      }[industry],
      options: [
        {
          id: 'A',
          text: "Thực thi chính sách mua nguyên liệu tập trung qua văn phòng Syndicate và áp đặt hạn ngạch sản xuất nghiêm ngặt.",
          effect: { capital: 100, stability: 80, integrationLevel: 2, scope: "Ngang" },
          actionTrigger: function() {
            gameState.stageGates.distributionUnified = true;
          },
          theory: "Syndicate kiểm soát cả đầu ra (bán hàng) lẫn đầu vào (thu mua nguyên liệu). Việc kiểm soát chặt chẽ lưu thông giúp ổn định hóa sản xuất nội bộ của liên minh.",
          detail: "Quy trình mua bán được thắt chặt. Vốn của bạn phục hồi thêm $100k, độ bền liên minh tăng lên 80%."
        },
        {
          id: 'B',
          text: "Dùng nguồn vốn chung thu mua lại các cơ sở khai thác nguyên liệu thô và phương tiện vận tải.",
          effect: { capital: -200, stability: 85, integrationLevel: 2, scope: "Dọc" },
          actionTrigger: function() {
            gameState.stageGates.verticalScopeMet = true;
          },
          theory: "Đây là bước khởi đầu của sự chuyển dịch từ liên kết Ngang (thỏa hiệp giữa các đơn vị cùng ngành) sang liên kết Dọc (thâu tóm chuỗi cung ứng dọc).",
          detail: "Bạn đã sở hữu các mỏ quặng/giếng dầu/mỏ than riêng. Phạm vi liên kết chuyển sang DỌC. Vốn giảm $200k đầu tư ban đầu nhưng tính tự chủ tăng cao."
        },
        {
          id: 'C',
          text: "Bỏ phiếu cho phép các thành viên tự thỏa thuận mua nguyên liệu ngoài thị trường tự do.",
          effect: { capital: -100, stability: 40, integrationLevel: 2, scope: "Ngang" },
          theory: "Nới lỏng quyền thu mua làm suy giảm nghiêm trọng vai trò của Syndicate, đẩy các thành viên trở lại tình trạng cạnh tranh nguồn cung nguyên liệu thô gay gắt.",
          detail: "Sự hỗn loạn mua nguyên liệu làm chi phí tăng cao. Vốn giảm $100k, độ bền Syndicate giảm mạnh xuống 40%."
        }
      ]
    },
    // ROUND 4: External Competition (Syndicate -> Trust)
    {
      round: 4,
      title: "Sự xuất hiện của đối thủ khổng lồ mới",
      desc: {
        petroleum: "Một tổ hợp lọc dầu mới từ châu Âu xâm nhập thị trường trong nước. Họ sở hữu công nghệ chưng cất hiện đại, sẵn sàng chấp nhận bù lỗ để phá vỡ vị thế Syndicate của bạn.",
        steel: "Các tập đoàn gang thép Anh Quốc ồ ạt xuất khẩu thép chất lượng cao sang Mỹ với giá cực rẻ nhờ công nghệ lò Bessemer quy mô lớn vượt trội.",
        railroad: "Một tuyến đường sắt song song được xây dựng bởi một nhóm tài phiệt vùng Trung Tây, đe dọa cướp sạch các hợp đồng vận tải béo bở của liên minh bạn."
      }[industry],
      options: [
        {
          id: 'A',
          text: "Kêu gọi thành viên tự hạ giá sản phẩm riêng lẻ để đối đầu trực tiếp.",
          effect: { capital: -350, stability: 20, integrationLevel: 2, scope: "Ngang" },
          theory: "Đối đầu bằng cạnh tranh giá thô sơ khi liên minh không thống nhất được năng lực sản xuất sẽ dẫn đến việc các thành viên yếu thế phá sản trước đối thủ khổng lồ.",
          detail: "Cuộc chiến giá cả nổ ra. Xí nghiệp của bạn và nhiều thành viên khác thiệt hại nặng nề. Vốn giảm $350k. Syndicate cận kề bờ vực đổ vỡ."
        },
        {
          id: 'B',
          text: "Đề nghị sáp nhập toàn bộ xí nghiệp thành viên vào một Công ty cổ phần duy nhất do Ban quản trị tối cao điều hành.",
          effect: { capital: 200, stability: 90, integrationLevel: 3, scope: "Ngang" },
          gateCheck: function() {
            // Syndicate -> Trust requires distributionUnified to be true (Option A in Round 3)
            // or if they had already established a strong Syndicate base.
            if (!gameState.stageGates.distributionUnified && gameState.integrationLevel < 2) {
              return {
                allowed: false,
                msg: "Thất bại: Bạn chưa thể tiến lên Trust vì các thành viên chưa quen với sự thống nhất trong khâu lưu thông (Syndicate). Việc nhảy cóc từ liên minh lỏng lẻo lên sáp nhập sản xuất hoàn toàn sẽ bị các chủ xí nghiệp từ chối do sợ mất quyền kiểm soát."
              };
            }
            return { allowed: true };
          },
          actionTrigger: function() {
            gameState.stageGates.competitivePressureMet = true;
          },
          theory: "Trust đại diện cho sự sáp nhập toàn diện. Các thành viên chuyển giao toàn bộ nhà máy, cổ phần cho Ban Quản trị ủy thác để đổi lấy chứng chỉ thụ hưởng lợi nhuận. Sự độc lập về sản xuất chính thức biến mất.",
          detail: "Các chủ xí nghiệp đồng ý ký giấy sáp nhập. Ban quản trị chung tối ưu hóa toàn bộ dây chuyền sản xuất, đè bẹp đối thủ ngoại lai. Bạn bước vào kỷ nguyên Trust (Bậc 3)! Vốn tăng $200k."
        },
        {
          id: 'C',
          text: "Tránh đối đầu trực tiếp, chủ động đề nghị chia sẻ 30% thị phần cho đối thủ mới.",
          effect: { capital: -150, stability: 50, integrationLevel: 2, scope: "Ngang" },
          theory: "Nhượng bộ trước các tập đoàn lớn chỉ trì hoãn sự sụp đổ. Nó thể hiện sự bất lực của một liên kết không có sự tập trung hóa sản xuất mạnh mẽ.",
          detail: "Doanh thu giảm mạnh do mất thị phần béo bở. Vốn của bạn giảm $150k."
        }
      ]
    },
    // ROUND 5: Internal Restructuring (Trust Expansion)
    {
      round: 5,
      title: "Tối ưu hóa sản xuất quy mô lớn",
      desc: {
        petroleum: "Để tối đa hóa lợi nhuận, Ban Quản trị Trust quyết định đóng cửa vĩnh viễn 15 nhà máy lọc dầu lỗi thời quy mô nhỏ trong liên minh và dồn nguồn lực xây dựng tổ hợp siêu lọc dầu.",
        steel: "Trust thép của bạn lên kế hoạch thanh lý các lò cao công nghệ cũ, tập trung đầu tư hệ thống lò luyện oxy hóa quy mô khổng lồ ở thành phố cảng.",
        railroad: "Hội đồng quản trị Trust đề xuất bãi bỏ 5 tuyến đường sắt phụ ít khách, sa thải hàng ngàn công nhân để dồn vốn nâng cấp mạng lưới đường ray kép hiện đại."
      }[industry],
      options: [
        {
          id: 'A',
          text: "Ủng hộ quyết định đóng cửa các cơ sở cũ, tập trung sản xuất quy mô lớn để nâng cao tỷ suất lợi nhuận.",
          effect: { capital: 300, stability: 90, integrationLevel: 3, scope: "Ngang" },
          theory: "Tập trung sản xuất là quy luật tất yếu của chủ nghĩa tư bản độc quyền. Việc loại bỏ các cơ sở nhỏ, lỗi thời giúp tận dụng lợi thế quy mô, tạo ra siêu lợi nhuận độc quyền.",
          detail: "Chi phí sản xuất giảm cực mạnh. Vốn của bạn tăng thêm $300k. Trust củng cố sức mạnh vững chắc."
        },
        {
          id: 'B',
          text: "Phản đối việc sa thải và đóng cửa nhà máy vì lo ngại xung đột công đoàn và phản kháng xã hội.",
          effect: { capital: -100, stability: 70, integrationLevel: 3, scope: "Ngang" },
          theory: "Trong kinh tế chính trị, sự nhân nhượng xã hội của nhà tư bản làm chậm lại tiến trình tập trung sản xuất, khiến năng lực cạnh tranh của Trust suy giảm.",
          detail: "Các cơ sở cũ hoạt động kém hiệu quả ngốn chi phí lớn. Vốn giảm $100k."
        },
        {
          id: 'C',
          text: "Đồng ý đóng cửa cơ sở cũ, đồng thời mở rộng đầu tư mua lại các ngành cung ứng phụ trợ hạ nguồn và thượng nguồn.",
          effect: { capital: 150, stability: 95, integrationLevel: 3, scope: "Dọc" },
          actionTrigger: function() {
            gameState.stageGates.verticalScopeMet = true;
          },
          theory: "Chuyển dịch sang liên kết dọc (Vertical Integration) giúp kiểm soát toàn diện từ khâu nguyên liệu đầu vào đến thành phẩm tiêu thụ, giảm chi phí trung gian.",
          detail: "Phạm vi liên kết chuyển sang DỌC. Bạn đã làm chủ chuỗi cung ứng khép kín. Vốn tăng $150k."
        }
      ]
    },
    // ROUND 6: Finance Capital Penetration (Trust -> Consortium)
    {
      round: 6,
      title: "Sức mạnh của Tư bản tài chính",
      desc: {
        petroleum: `Hệ thống ${transport} xuyên bang cần hàng chục triệu USD để hoàn thiện. Một ngân hàng tài phiệt lớn đề xuất rót vốn khổng lồ mua lại cổ phần chi phối và sáp nhập bạn với các hãng đường sắt vận chuyển chính.`,
        steel: `Để thâu tóm toàn bộ mỏ ${raw} ở phía Bắc và xây dựng ${transport} vận tải, bạn cần nguồn vốn vượt xa khả năng của Trust. Một liên minh ngân hàng lớn đề nghị đầu tư kiểm soát.`,
        railroad: `Việc mở rộng các ga trung tâm tại New York đòi hỏi lượng vốn khổng lồ. Nhóm tài phiệt tài chính Wall Street đề nghị rót vốn toàn diện để kiểm soát mạng lưới đường sắt của bạn.`
      }[industry],
      options: [
        {
          id: 'A',
          text: "Chấp nhận vốn đầu tư của Ngân hàng lớn, đồng ý sáp nhập đa ngành và nhường ghế Hội đồng quản trị cho đại diện ngân hàng.",
          effect: { capital: 500, stability: 95, integrationLevel: 4, scope: "Dọc" },
          gateCheck: function() {
            // Trust -> Consortium requires verticalScopeMet to be true
            if (!gameState.stageGates.verticalScopeMet && gameState.scope !== 'Dọc') {
              return {
                allowed: false,
                msg: "Thất bại: Bạn chưa thể tiến lên Consortium vì thiếu sự liên kết dọc đa ngành. Consortium không chỉ là liên kết cùng ngành mà phải là sự kết hợp của nhiều ngành công nghiệp liên quan được kiểm soát bởi các định chế tài chính."
              };
            }
            return { allowed: true };
          },
          actionTrigger: function() {
            gameState.stageGates.financeCapitalMet = true;
          },
          theory: "Sự xâm nhập của tư bản ngân hàng vào tư bản công nghiệp hình thành nên tư bản tài chính và tầng lớp tài phiệt. Sự liên kết đa ngành, dọc - ngang đan xen tạo nên Consortium - hình thức độc quyền cao nhất.",
          detail: "Định chế tài chính khổng lồ chính thức tiếp quản doanh nghiệp của bạn. Bạn bước vào hàng ngũ tài phiệt độc quyền Consortium (Bậc 4)! Vốn tăng vọt $500k."
        },
        {
          id: 'B',
          text: "Từ chối sự can thiệp của ngân hàng, cố gắng tự tích lũy từ nguồn lợi nhuận giữ lại để mở rộng từng bước.",
          effect: { capital: 100, stability: 80, integrationLevel: 3, scope: "Dọc" },
          theory: "Từ chối tư bản tài chính sẽ hạn chế quy mô mở rộng. Trong giai đoạn chủ nghĩa đế quốc, các doanh nghiệp độc lập không có sự bảo trợ tài chính rất dễ bị các Consortium khổng lồ khác thâu tóm.",
          detail: "Bạn duy trì được sự độc lập của Trust cũ nhưng tốc độ tăng trưởng chậm. Vốn chỉ tăng nhẹ $100k."
        },
        {
          id: 'C',
          text: "Vay ngắn hạn từ nhiều ngân hàng nhỏ với lãi suất cao để tránh bị thâu tóm quyền kiểm soát.",
          effect: { capital: 200, stability: 60, integrationLevel: 3, scope: "Dọc" },
          theory: "Sử dụng đòn bẩy tài chính ngắn hạn lãi suất cao không tạo ra sự dung hợp giữa tư bản công nghiệp và ngân hàng mà chỉ làm tăng rủi ro nợ nần, suy giảm tính ổn định hệ thống.",
          detail: "Bạn có vốn $200k nhưng gánh nặng nợ nần đè nặng. Độ bền liên minh giảm mạnh xuống 60%."
        }
      ]
    },
    // ROUND 7: Regulatory / Anti-trust (Consortium / Holding Company)
    {
      round: 7,
      title: "Luật chống độc quyền đe dọa đế chế",
      desc: {
        petroleum: "Dư luận dậy sóng trước sự thống trị tuyệt đối của tập đoàn bạn. Chính phủ ban hành Đạo luật Sherman nhằm chia nhỏ đế chế dầu mỏ của bạn thành các mảnh độc lập.",
        steel: "Bộ Tư pháp khởi kiện tập đoàn thép độc quyền của bạn vi phạm luật cạnh tranh lành mạnh, yêu cầu giải thể các nhà máy sáp nhập.",
        railroad: "Ủy ban Thương mại Liên bang buộc tội tập đoàn đường sắt của bạn thao túng giá cước và áp đặt độc quyền vận tải, đe dọa tịch thu giấy phép hoạt động."
      }[industry],
      options: [
        {
          id: 'A',
          text: "Tái cấu trúc tập đoàn thành một công ty mẹ (Holding Company) nắm giữ cổ phần chi phối ở các công ty con trên danh nghĩa độc lập.",
          effect: { capital: 150, stability: 90, integrationLevel: 4, scope: "Dọc" },
          theory: "Để đối phó với pháp luật, các Consortium tiến hóa thành mô hình Holding Company (Công ty nắm giữ cổ phần) hoặc Concern. Đây là cách thức tài phiệt tài chính kiểm soát gián tiếp hàng trăm doanh nghiệp thông qua hệ thống tham dự.",
          detail: "Lách luật thành công! Đế chế của bạn chia nhỏ trên giấy tờ nhưng thực chất vẫn chịu sự chỉ đạo thống nhất của ban quản trị tài phiệt. Vốn tăng $150k."
        },
        {
          id: 'B',
          text: "Dùng nguồn vốn khổng lồ để vận động hành lang chính trị gia nhằm sửa đổi hoặc làm vô hiệu hóa việc thi hành luật chống độc quyền.",
          effect: { capital: -200, stability: 80, integrationLevel: 4, scope: "Dọc" },
          theory: "Sự kết hợp giữa tài phiệt độc quyền và bộ máy nhà nước tạo thành chủ nghĩa tư bản độc quyền nhà nước. Tuy nhiên, việc vận động trực tiếp rất tốn kém và mang lại rủi ro chính trị.",
          detail: "Bạn tốn $200k tiền vận động hành lang. Đạo luật tạm thời bị đóng băng nhưng dư luận vẫn tiếp tục phẫn nộ."
        },
        {
          id: 'C',
          text: "Chấp nhận phán quyết của tòa án, giải thể tập đoàn thành các doanh nghiệp cạnh tranh độc lập.",
          effect: { capital: -350, stability: 30, integrationLevel: 1, scope: "Ngang" },
          theory: "Sự phân rã hoàn toàn của độc quyền dưới sức ép pháp lý đưa thị trường trở lại trạng thái liên kết lỏng lẻo (Cartel) hoặc tự do cạnh tranh, phá hủy cấu trúc tích tụ tư bản đã dựng lên.",
          detail: "Đế chế của bạn bị xé nhỏ. Quy mô kinh tế biến mất, Vốn giảm nghiêm trọng $350k, mức độ liên kết tụt hẳn xuống mức Cartel."
        }
      ]
    },
    // ROUND 8: Export of Capital (Imperialism Pinnacle)
    {
      round: 8,
      title: "Xuất khẩu tư bản ra thế giới",
      desc: {
        petroleum: "Đế chế dầu mỏ của bạn đã khống chế hoàn toàn thị trường trong nước. Lợi nhuận tích lũy quá lớn sinh ra hiện tượng 'tư bản thừa'. Tiếp tục đầu tư trong nước sẽ làm giảm tỷ suất lợi nhuận.",
        steel: "Sản lượng thép vượt xa nhu cầu xây dựng nội địa. Hàng chục triệu USD lợi nhuận nằm im trong ngân hàng cần tìm kiếm cơ hội sinh lời cao hơn.",
        railroad: "Mạng lưới đường sắt trong nước đã bão hòa hoàn toàn. Nguồn vốn tích tụ khổng lồ của các nhà tài phiệt đường sắt cần tìm lối thoát mới ra ngoài biên giới."
      }[industry],
      options: [
        {
          id: 'A',
          text: "Xuất khẩu tư bản: Rót vốn đầu tư khai thác tài nguyên và xây dựng cơ sở hạ tầng tại các nước thuộc địa/chậm phát triển để tận dụng nhân công giá rẻ.",
          effect: { capital: 600, stability: 98, integrationLevel: 4, scope: "Dọc" },
          theory: "Xuất khẩu tư bản là một trong những đặc trưng kinh tế cơ bản của chủ nghĩa đế quốc (giai đoạn tột cùng của độc quyền). Các nước đế quốc xuất khẩu tư bản ra nước ngoài nhằm chiếm đoạt nguồn siêu lợi nhuận độc quyền từ các nước chậm phát triển.",
          detail: "Bạn rót vốn xây giếng dầu/nhà máy thép/tuyến xe lửa tại các nước thuộc địa. Lợi nhuận siêu ngạch chảy ngược về tập đoàn. Vốn tăng cực đại $600k, khẳng định vị thế tài phiệt đế quốc!"
        },
        {
          id: 'B',
          text: "Tiếp tục đầu tư trong nước bằng cách hạ giá bán sản phẩm để kích cầu tiêu dùng nội địa.",
          effect: { capital: 100, stability: 85, integrationLevel: 4, scope: "Dọc" },
          theory: "Đầu tư thêm vào thị trường đã bão hòa dẫn đến xu hướng giảm sút tỷ suất lợi nhuận. Sự lãng phí tư bản tích tụ này làm chậm lại sự phát triển của độc quyền.",
          detail: "Thị trường nội địa không hấp thụ được nhiều. Vốn của bạn chỉ tăng nhẹ $100k, vị thế độc quyền dậm chân tại chỗ."
        },
        {
          id: 'C',
          text: "Dùng lợi nhuận dư thừa chia hết dưới dạng cổ tức cao cho các cổ đông tiêu dùng cá nhân.",
          effect: { capital: -200, stability: 70, integrationLevel: 4, scope: "Dọc" },
          theory: "Tiêu dùng hết tư bản tích lũy thay vì tái đầu tư mở rộng quy mô quốc tế làm suy yếu tiềm lực tài chính của tập đoàn, khiến nó tụt hậu trong cuộc phân chia thế giới giữa các thế lực độc quyền quốc tế.",
          detail: "Các cổ đông vui mừng nhưng sức mạnh tài chính của tập đoàn bị suy giảm nghiêm trọng. Vốn giảm $200k."
        }
      ]
    }
  ];
}

// Map integration levels to textual titles
const INTEGRATION_LABELS = {
  0: "Cạnh Tranh Tự Do",
  1: "Bậc 1: Cartel",
  2: "Bậc 2: Syndicate",
  3: "Bậc 3: Trust",
  4: "Bậc 4: Consortium"
};

// Global variables for game session
let scenariosDeck = [];
let pendingTransition = null;

// Select Industry and Start Game
function selectIndustry(ind) {
  gameState.industry = ind;
  gameState.capital = 1000;
  gameState.integrationLevel = 0;
  gameState.stability = 100;
  gameState.scope = 'Ngang';
  gameState.currentRound = 0;
  gameState.history = [];
  gameState.cartelRoundsCount = 0;
  gameState.stageGates = {
    compromisesCount: 0,
    distributionUnified: false,
    competitivePressureMet: false,
    verticalScopeMet: false,
    financeCapitalMet: false
  };

  scenariosDeck = getScenarios(ind);

  document.getElementById('screen-welcome').classList.add('hidden');
  document.getElementById('screen-game').classList.remove('hidden');
  
  showToast(`Khởi đầu ngành: ${ind === 'petroleum' ? 'Dầu mỏ' : ind === 'steel' ? 'Thép' : 'Đường sắt'}`);
  loadNextRound();
}

// Load current round details
function loadNextRound() {
  gameState.currentRound++;
  if (gameState.currentRound > scenariosDeck.length) {
    endGame();
    return;
  }

  // Cartel stability erosion check if player stays in Cartel (Level 1)
  if (gameState.integrationLevel === 1) {
    gameState.cartelRoundsCount++;
    if (gameState.cartelRoundsCount >= 2) {
      // Degrade stability to show Cartel's fragility
      gameState.stability = Math.max(10, gameState.stability - 25);
      showToast("⚠️ Cartel lung lay! Thỏa ước lỏng lẻo khiến độ bền liên minh sụt giảm!");
      
      // Random chance of betrayal impact (30% probability)
      if (Math.random() < 0.3) {
        gameState.capital = Math.max(100, gameState.capital - 150);
        showToast("💥 Một thành viên bán phá giá lén lút! Vốn của bạn bị thiệt hại $150k!");
      }
    }
  } else {
    gameState.cartelRoundsCount = 0; // reset
  }

  updateDashboard();

  const scenario = scenariosDeck[gameState.currentRound - 1];
  
  document.getElementById('round-indicator').innerText = `Vòng ${gameState.currentRound} / ${scenariosDeck.length}`;
  document.getElementById('scenario-title').innerText = scenario.title;
  document.getElementById('scenario-body').innerText = scenario.desc;

  const optionsList = document.getElementById('options-list');
  optionsList.innerHTML = '';

  scenario.options.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.onclick = () => selectOption(opt);

    const badge = document.createElement('div');
    badge.className = 'option-badge';
    badge.innerText = opt.id;

    const text = document.createElement('div');
    text.className = 'option-text';
    text.innerText = opt.text;

    card.appendChild(badge);
    card.appendChild(text);
    optionsList.appendChild(card);
  });
}

// Option chosen handler
function selectOption(opt) {
  // 1. Stage Gate Check before proceeding
  if (opt.gateCheck) {
    const check = opt.gateCheck();
    if (!check.allowed) {
      alert(check.msg); // Using alert as feedback dialog, simple and clear for "learning from mistakes"
      return; // Do not apply changes, let them choose another option
    }
  }

  // 2. Trigger active state modifications if any
  if (opt.actionTrigger) {
    opt.actionTrigger();
  }

  // 3. Record choice to history
  gameState.history.push({
    round: gameState.currentRound,
    choiceId: opt.id,
    scenarioTitle: scenariosDeck[gameState.currentRound - 1].title,
    scenarioDesc: scenariosDeck[gameState.currentRound - 1].desc,
    choiceText: opt.text,
    theory: opt.theory,
    detail: opt.detail,
    statsBefore: {
      capital: gameState.capital,
      integrationLevel: gameState.integrationLevel,
      stability: gameState.stability,
      scope: gameState.scope
    }
  });

  // 4. Update Stage Gate counts
  if (opt.effect.compromisesCount) {
    gameState.stageGates.compromisesCount += opt.effect.compromisesCount;
  }

  // 5. Apply effect
  const prevLevel = gameState.integrationLevel;
  
  gameState.capital = Math.max(0, gameState.capital + opt.effect.capital);
  gameState.stability = Math.max(0, Math.min(100, opt.effect.stability !== undefined ? (opt.effect.stability === 0 ? 0 : opt.effect.stability) : gameState.stability));
  if (opt.effect.integrationLevel !== undefined) {
    gameState.integrationLevel = opt.effect.integrationLevel;
  }
  if (opt.effect.scope) {
    gameState.scope = opt.effect.scope;
  }

  // If capital drops to 0, bankrupt
  if (gameState.capital <= 0) {
    showExplanationModal(opt, true);
    return;
  }

  // Check for integration level transition
  if (gameState.integrationLevel > prevLevel && STAGE_DEFINITIONS[gameState.integrationLevel]) {
    pendingTransition = gameState.integrationLevel;
  } else {
    pendingTransition = null;
  }

  // 6. Show the explanation modal
  showExplanationModal(opt, false);
}

// Update the Top Dashboard view
function updateDashboard() {
  document.getElementById('stat-capital').innerText = `$${gameState.capital.toLocaleString()}k`;
  
  // Capital Progress
  const capPercent = Math.min(100, (gameState.capital / 2500) * 100);
  const capBar = document.getElementById('progress-capital');
  capBar.style.width = `${capPercent}%`;
  if (gameState.capital < 300) {
    capBar.className = "stat-progress-bar danger";
  } else {
    capBar.className = "stat-progress-bar";
  }

  // Integration Level Progress
  document.getElementById('stat-integration').innerText = INTEGRATION_LABELS[gameState.integrationLevel];
  const integrationPercent = (gameState.integrationLevel / 4) * 100;
  document.getElementById('progress-integration').style.width = `${integrationPercent}%`;

  // Stability Progress
  document.getElementById('stat-stability').innerText = `${gameState.stability}%`;
  const stabBar = document.getElementById('progress-stability');
  stabBar.style.width = `${gameState.stability}%`;
  if (gameState.stability < 40) {
    stabBar.className = "stat-progress-bar danger";
  } else if (gameState.stability > 75) {
    stabBar.className = "stat-progress-bar success";
  } else {
    stabBar.className = "stat-progress-bar";
  }

  // Scope Progress
  document.getElementById('stat-scope').innerText = gameState.scope;
  document.getElementById('progress-scope').style.width = gameState.scope === 'Ngang' ? '50%' : '100%';
}

// Explanation Modal Actions
function showExplanationModal(opt, isBankrupt) {
  const modal = document.getElementById('explanation-modal');
  document.getElementById('modal-explanation').innerText = opt.detail;
  
  const deltaText = document.getElementById('modal-delta');
  let deltaStr = `Thay đổi Vốn tích tụ: ${opt.effect.capital >= 0 ? '+' : ''}${opt.effect.capital}k`;
  if (opt.effect.stability !== undefined) {
    deltaStr += ` | Độ bền liên minh: ${opt.effect.stability}%`;
  }
  deltaText.innerText = deltaStr;

  document.getElementById('modal-theory').innerHTML = `<strong>Lý luận giáo trình:</strong> "${opt.theory}"`;

  if (isBankrupt) {
    document.getElementById('modal-title').innerText = "DOANH NGHIỆP PHÁ SẢN!";
    document.getElementById('modal-icon').innerText = "☠️";
    document.getElementById('modal-explanation').innerText = "Vốn tích tụ của bạn đã giảm xuống 0. Doanh nghiệp không chịu nổi nhiệt của cuộc cạnh tranh tàn khốc và chính thức bị thôn tính.";
    // Override standard button handler
    const btn = modal.querySelector('.btn');
    btn.onclick = () => {
      closeExplanationModal();
      endGame();
    };
  } else {
    document.getElementById('modal-title').innerText = "Kết quả Lựa chọn";
    document.getElementById('modal-icon').innerText = "💡";
    const btn = modal.querySelector('.btn');
    btn.onclick = () => {
      closeExplanationModal();
      handleRoundTransition();
    };
  }

  modal.classList.remove('hidden');
}

function closeExplanationModal() {
  document.getElementById('explanation-modal').classList.add('hidden');
}

// Decide what screen to show next
function handleRoundTransition() {
  if (pendingTransition !== null) {
    // Show stage gate screen
    const gateDef = STAGE_DEFINITIONS[pendingTransition];
    document.getElementById('screen-game').classList.add('hidden');
    
    const transScreen = document.getElementById('screen-transition');
    document.getElementById('transition-gate-icon').innerText = gateDef.icon;
    document.getElementById('transition-gate-title').innerText = gateDef.title;
    document.getElementById('transition-gate-def').innerHTML = gateDef.def;
    
    transScreen.classList.remove('hidden');
  } else {
    loadNextRound();
  }
}

// Confirm transition on stage gate screen
function confirmTransition() {
  document.getElementById('screen-transition').classList.add('hidden');
  document.getElementById('screen-game').classList.remove('hidden');
  pendingTransition = null;
  loadNextRound();
}

// Toast alerts helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.remove('hidden');
  
  // Force reflow
  toast.offsetHeight;
  
  // Hide after 3s
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// End Game & Draw SVG Decision Tree
function endGame() {
  document.getElementById('screen-game').classList.add('hidden');
  document.getElementById('screen-transition').classList.add('hidden');
  
  const endScreen = document.getElementById('screen-end');
  endScreen.classList.remove('hidden');

  // Stats set
  document.getElementById('end-capital').innerText = `$${gameState.capital.toLocaleString()}k`;
  document.getElementById('end-integration').innerText = INTEGRATION_LABELS[gameState.integrationLevel];
  document.getElementById('end-scope').innerText = gameState.scope;

  // Set flavor feedback
  let flavor = "";
  if (gameState.capital <= 0) {
    flavor = "Bị phá sản và thôn tính bởi các thế lực độc quyền khổng lồ khác.";
  } else if (gameState.integrationLevel === 4) {
    flavor = "Tuyệt vời! Bạn đã leo lên đỉnh cao độc quyền Consortium, gia nhập hàng ngũ tài phiệt tài chính thống trị!";
  } else if (gameState.integrationLevel === 3) {
    flavor = "Khá tốt! Bạn đã sáp nhập thành công vào một Trust vững chắc, tối ưu hóa sản xuất quy mô lớn.";
  } else if (gameState.integrationLevel >= 1) {
    flavor = "Liên minh của bạn dừng lại ở bậc sơ khai (Cartel/Syndicate). Hãy cẩn thận vì nó rất dễ bị lung lay bởi ngoại lực.";
  } else {
    flavor = "Bạn vẫn ở thời kỳ Cạnh Tranh Tự Do đơn độc và dễ dàng bị các tổ chức độc quyền bóp nghẹt.";
  }
  document.getElementById('end-status-flavor').innerText = flavor;

  // Draw the SVG Decision Tree
  drawDecisionTree();

  // Render the educational quiz
  renderQuiz();
}

// Draw decision tree using SVG
function drawDecisionTree() {
  const svg = document.getElementById('decision-tree-svg');
  svg.innerHTML = ''; // Clear previous SVG contents

  // Tree nodes definition
  // 8 rounds, each has 3 possible choice nodes (A, B, C)
  const columnsCount = 8;
  const rowsCount = 3;
  const colWidth = 100;
  const rowHeight = 90;
  const startX = 60;
  const startY = 50;

  // Theoretical path definition (Lenin's Standard Progression)
  // Round 1: B (Cartel)
  // Round 2: B (Syndicate)
  // Round 3: A (Syndicate Solidified)
  // Round 4: B (Trust)
  // Round 5: C (Trust Vertical Transition)
  // Round 6: A (Consortium)
  // Round 7: A (Holding/Consortium)
  // Round 8: A (Capital Export)
  const theoreticalPath = [
    { round: 1, choice: 'B' },
    { round: 2, choice: 'B' },
    { round: 3, choice: 'A' },
    { round: 4, choice: 'B' },
    { round: 5, choice: 'C' },
    { round: 6, choice: 'A' },
    { round: 7, choice: 'A' },
    { round: 8, choice: 'A' }
  ];

  // Helper to get row Y coordinate based on choice ID
  function getYByChoice(choiceId) {
    if (choiceId === 'A') return startY;
    if (choiceId === 'B') return startY + rowHeight;
    return startY + 2 * rowHeight; // 'C'
  }

  // Draw background grid lines connecting adjacent columns
  for (let c = 0; c < columnsCount - 1; c++) {
    for (let r1 = 0; r1 < rowsCount; r1++) {
      const choiceId1 = String.fromCharCode(65 + r1);
      const x1 = startX + c * colWidth;
      const y1 = getYByChoice(choiceId1);

      for (let r2 = 0; r2 < rowsCount; r2++) {
        const choiceId2 = String.fromCharCode(65 + r2);
        const x2 = startX + (c + 1) * colWidth;
        const y2 = getYByChoice(choiceId2);

        // Check if this connection is part of the player's path
        const playerFromChoice = gameState.history[c]?.choiceId;
        const playerToChoice = gameState.history[c + 1]?.choiceId;
        const isPlayerLink = (playerFromChoice === choiceId1 && playerToChoice === choiceId2);

        // Check if this is the theoretical path link
        const isTheoLink = (theoreticalPath[c].choice === choiceId1 && theoreticalPath[c + 1].choice === choiceId2);

        // Draw line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);

        if (isPlayerLink) {
          line.setAttribute("stroke", "var(--color-border-gold)");
          line.setAttribute("stroke-width", "4");
          line.setAttribute("class", "node-link");
        } else if (isTheoLink) {
          line.setAttribute("stroke", "#64748b");
          line.setAttribute("stroke-width", "2");
          line.setAttribute("stroke-dasharray", "4,4");
        } else {
          line.setAttribute("stroke", "#1e293b");
          line.setAttribute("stroke-width", "1");
        }
        svg.appendChild(line);
      }
    }
  }

  // Draw node circles & text
  for (let c = 0; c < columnsCount; c++) {
    const roundIndex = c + 1;
    const scenario = scenariosDeck[c];

    // Label on top of columns
    const colText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    colText.setAttribute("x", startX + c * colWidth);
    colText.setAttribute("y", startY - 25);
    colText.setAttribute("text-anchor", "middle");
    colText.setAttribute("fill", "var(--color-text-muted)");
    colText.setAttribute("font-size", "10px");
    colText.setAttribute("font-weight", "600");
    colText.textContent = `VÒNG ${roundIndex}`;
    svg.appendChild(colText);

    for (let r = 0; r < rowsCount; r++) {
      const choiceId = String.fromCharCode(65 + r);
      const x = startX + c * colWidth;
      const y = getYByChoice(choiceId);
      const optData = scenario.options[r];

      // Check user interaction
      const hasChosen = (gameState.history[c]?.choiceId === choiceId);
      const isTheo = (theoreticalPath[c].choice === choiceId);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", hasChosen ? "8" : "6");
      circle.setAttribute("class", "node-circle");

      // Set colors based on state
      if (hasChosen) {
        circle.setAttribute("fill", "var(--color-border-gold)");
        circle.setAttribute("stroke", "#fff");
        circle.setAttribute("stroke-width", "2");
      } else if (isTheo) {
        circle.setAttribute("fill", "transparent");
        circle.setAttribute("stroke", "#94a3b8");
        circle.setAttribute("stroke-width", "2");
      } else {
        circle.setAttribute("fill", "#1e293b");
        circle.setAttribute("stroke", "#334155");
        circle.setAttribute("stroke-width", "1");
      }

      // Add interactive attributes
      circle.setAttribute("data-round", roundIndex);
      circle.setAttribute("data-choice", choiceId);
      circle.setAttribute("data-title", scenario.title);
      circle.setAttribute("data-desc", scenario.desc);
      circle.setAttribute("data-text", optData.text);
      circle.setAttribute("data-theory", optData.theory);
      circle.setAttribute("data-chosen", hasChosen ? "true" : "false");
      circle.setAttribute("data-theo", isTheo ? "true" : "false");

      // Event handlers for tooltips
      circle.addEventListener('mouseenter', showTreeTooltip);
      circle.addEventListener('mouseleave', hideTreeTooltip);
      circle.addEventListener('click', showTreeTooltipModal);

      svg.appendChild(circle);

      // Node option labels (A, B, C)
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "7px");
      label.setAttribute("fill", hasChosen ? "#000" : "#94a3b8");
      label.setAttribute("style", "pointer-events: none; font-weight: bold;");
      label.textContent = choiceId;
      svg.appendChild(label);
    }
  }
}

// Tooltip positioning and rendering
function showTreeTooltip(e) {
  const c = e.target;
  const tooltip = document.getElementById('tree-tooltip');
  const wrapper = document.getElementById('tree-container-wrapper');
  
  const rect = c.getBoundingClientRect();
  const wrapRect = wrapper.getBoundingClientRect();
  
  const round = c.getAttribute('data-round');
  const choice = c.getAttribute('data-choice');
  const title = c.getAttribute('data-title');
  const optText = c.getAttribute('data-text');
  const chosen = c.getAttribute('data-chosen') === 'true';
  const theo = c.getAttribute('data-theo') === 'true';

  let statusStr = "";
  if (chosen) statusStr = `<span style="color: var(--color-border-gold); font-weight: bold;">[Bạn đã chọn]</span> `;
  if (theo) statusStr += `<span style="color: #94a3b8; font-weight: bold;">[Đường đi lý thuyết]</span>`;

  tooltip.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 5px; color: var(--color-border-gold);">Vòng ${round} - Lựa chọn ${choice}</div>
    <div style="font-weight: 600; margin-bottom: 5px;">${title}</div>
    <div style="color: var(--color-text-muted); font-size: 0.8rem; margin-bottom: 8px;">"${optText}"</div>
    <div style="font-size: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 5px;">
      ${statusStr || '<span style="color: #475569;">Lựa chọn khả dĩ</span>'}
    </div>
  `;

  // Calculate position relative to container
  const x = rect.left - wrapRect.left + wrapper.scrollLeft + 15;
  const y = rect.top - wrapRect.top + wrapper.scrollTop + 15;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.opacity = 1;
}

function hideTreeTooltip() {
  document.getElementById('tree-tooltip').style.opacity = 0;
}

// Click to view the theoretical content card detail in a modal
function showTreeTooltipModal(e) {
  const c = e.target;
  const round = c.getAttribute('data-round');
  const choice = c.getAttribute('data-choice');
  const title = c.getAttribute('data-title');
  const optText = c.getAttribute('data-text');
  const theory = c.getAttribute('data-theory');
  const chosen = c.getAttribute('data-chosen') === 'true';

  const modal = document.getElementById('explanation-modal');
  document.getElementById('modal-title').innerText = `Vòng ${round} - Lựa chọn ${choice}: ${title}`;
  document.getElementById('modal-icon').innerText = "📚";
  document.getElementById('modal-explanation').innerText = `Hành động: ${optText}`;
  document.getElementById('modal-delta').innerText = chosen ? "Trạng thái: Đây là lựa chọn của bạn trong lượt chơi." : "Trạng thái: Đây là lựa chọn tham khảo.";
  document.getElementById('modal-theory').innerHTML = `<strong>Khái niệm & Ý nghĩa lý thuyết:</strong><br>${theory}`;
  
  const btn = modal.querySelector('.btn');
  btn.onclick = () => closeExplanationModal();

  modal.classList.remove('hidden');
}

// QUIZ DATA
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Câu 1. Điểm khác biệt kinh tế - pháp lý cốt lõi phân định ranh giới giữa một tổ chức độc quyền dạng Syndicate và Trust là gì?",
    options: [
      "Syndicate thống nhất cả sản xuất và tiêu thụ dưới một hội đồng quản trị chung, trong khi Trust cho phép thành viên độc lập về sản xuất.",
      "Trong Syndicate, các xí nghiệp thành viên độc lập về sản xuất nhưng mất tính độc lập về lưu thông; còn trong Trust, các thành viên mất cả tính độc lập về sản xuất lẫn lưu thông và quy về một ban quản trị ủy thác tối cao.",
      "Syndicate là liên kết dọc giữa các ngành khác nhau, còn Trust là liên kết ngang giữa các doanh nghiệp cùng ngành.",
      "Syndicate chịu sự chi phối hoàn toàn của tư bản tài chính ngân hàng, còn Trust hoạt động độc lập chỉ bằng nguồn vốn công nghiệp tự tích lũy."
    ],
    correctIndex: 1,
    explanation: "Syndicate thống nhất khâu lưu thông (mua nguyên liệu và bán sản phẩm thông qua một văn phòng đại diện chung) nhưng sản xuất vẫn độc lập. Còn Trust tiến lên một bậc cao hơn: sáp nhập toàn diện cả sản xuất lẫn lưu thông dưới một ban quản lý tối cao (Board of Trustees), các xí nghiệp thành viên cũ mất hết tính độc lập và chủ doanh nghiệp trở thành cổ đông nhận cổ tức."
  },
  {
    id: 2,
    question: "Câu 2. Tại sao sự chuyển dịch từ liên kết ngang (cùng ngành) sang liên kết dọc (đa ngành) lại là điều kiện tất yếu để hình thành Consortium, và vai trò của tư bản tài chính là gì?",
    options: [
      "Liên kết ngang dễ bị chính phủ xử phạt hành chính nên doanh nghiệp chuyển sang liên kết dọc để phân tán rủi ro pháp lý.",
      "Liên kết dọc giúp tăng giá bán thành phẩm lên nhiều lần, còn tư bản tài chính chỉ đóng vai trò trung gian thu thuế hộ nhà nước.",
      "Liên kết ngang chỉ giải quyết cạnh tranh nội bộ một ngành; liên kết dọc thâu tóm chuỗi cung ứng đa ngành từ nguyên liệu thô đến thành phẩm. Quy mô khổng lồ này đòi hỏi sự thâm nhập của tư bản ngân hàng để tài trợ vốn và kiểm soát tài chính, hình thành Consortium dưới tay các tài phiệt.",
      "Consortium thực chất là một Cartel quốc tế liên kết dọc để thống nhất giá cả nguyên liệu thô trên phạm vi toàn cầu mà không cần sáp nhập sản xuất."
    ],
    correctIndex: 2,
    explanation: "Consortium là tổ chức độc quyền đa ngành khổng lồ, liên kết dọc chuỗi giá trị từ nguyên liệu thô đến thành phẩm. Quy mô khổng lồ này vượt quá khả năng tự tích lũy của tư bản công nghiệp, bắt buộc phải có sự dung hợp sâu sắc với tư bản ngân hàng (tạo thành tư bản tài chính) nhằm cấp vốn và mua cổ phần khống chế, tạo thành đế chế tài phiệt Consortium."
  },
  {
    id: 3,
    question: "Câu 3. Dưới góc nhìn kinh tế chính trị Mác - Lênin, bản chất kinh tế của hiện tượng 'tư bản thừa' dẫn đến hành vi xuất khẩu tư bản của các Consortium độc quyền là gì?",
    options: [
      "Do sản xuất trong nước đã bão hòa và các Consortium muốn viện trợ nhân đạo phát triển cho các nước chậm phát triển.",
      "Không phải là tư bản không thể đầu tư trong nước, mà là do đầu tư tiếp trong nước sẽ làm giảm tỷ suất lợi nhuận do tích tụ tư bản quá cao. Xuất khẩu tư bản ra nước ngoài nhằm tìm kiếm tỷ suất lợi nhuận siêu ngạch ở những nơi có giá nhân công rẻ, đất đai rẻ và nguyên liệu rẻ.",
      "Là hiện tượng các ngân hàng thương mại thừa tiền mặt do người dân gửi tiết kiệm quá nhiều nên phải đem cho các nước chậm phát triển vay dài hạn với lãi suất 0%.",
      "Do chính phủ nước sở tại áp đặt các Consortium phải mang vốn ra nước ngoài để giảm thiểu ô nhiễm môi trường trong nước."
    ],
    correctIndex: 1,
    explanation: "Bản chất kinh tế của 'tư bản thừa' không phải là không thể đầu tư trong nước, mà là do tích tụ tư bản quá cao làm giảm sút tỷ suất lợi nhuận nội địa. Các tổ chức độc quyền buộc phải xuất khẩu tư bản ra nước ngoài - nơi có giá nhân công rất rẻ, đất đai rẻ, nguyên liệu thô dồi dào - để thu về tỷ suất lợi nhuận siêu ngạch."
  }
];

// Render dynamic quiz content
function renderQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  // Reset quiz score display
  const scoreBox = document.getElementById('quiz-score');
  scoreBox.classList.add('hidden');
  scoreBox.innerText = '';
  
  // Reset/Enable Check Button
  const checkBtn = document.getElementById('btn-check-quiz');
  checkBtn.disabled = false;
  checkBtn.innerText = '📝 Nộp bài & Xem giải thích';

  QUIZ_QUESTIONS.forEach((q, qIdx) => {
    const card = document.createElement('div');
    card.className = 'quiz-question-card';

    const qTitle = document.createElement('div');
    qTitle.style.fontWeight = '600';
    qTitle.style.fontSize = '1.05rem';
    qTitle.style.color = '#ebdcb2';
    qTitle.style.marginBottom = '12px';
    qTitle.innerText = q.question;
    card.appendChild(qTitle);

    const optionsList = document.createElement('div');
    optionsList.className = 'quiz-options-list';

    q.options.forEach((optText, optIdx) => {
      const label = document.createElement('label');
      label.className = 'quiz-option-label';
      label.id = `q-label-${q.id}-${optIdx}`;

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `quiz-q-${q.id}`;
      radio.value = optIdx;
      
      // Update styling on click
      radio.onchange = () => {
        // Clear selected class from other options in this question
        for (let i = 0; i < q.options.length; i++) {
          document.getElementById(`q-label-${q.id}-${i}`).classList.remove('selected');
        }
        label.classList.add('selected');
      };

      const span = document.createElement('span');
      span.innerText = optText;

      label.appendChild(radio);
      label.appendChild(span);
      optionsList.appendChild(label);
    });
    card.appendChild(optionsList);

    // Explanation Box (hidden initially)
    const expBox = document.createElement('div');
    expBox.className = 'quiz-explanation-box hidden';
    expBox.id = `q-exp-${q.id}`;
    expBox.innerHTML = `<strong>Giải thích kinh tế học:</strong> ${q.explanation}`;
    card.appendChild(expBox);

    container.appendChild(card);
  });
}

// Evaluate MCQ selections
function checkQuizAnswers() {
  let score = 0;
  let allAnswered = true;
  let userAnswers = [];

  QUIZ_QUESTIONS.forEach(q => {
    const radios = document.getElementsByName(`quiz-q-${q.id}`);
    let selectedIdx = -1;
    for (let i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        selectedIdx = i;
        break;
      }
    }
    if (selectedIdx === -1) {
      allAnswered = false;
    }
    userAnswers.push(selectedIdx);
  });

  if (!allAnswered) {
    alert("Vui lòng trả lời đầy đủ cả 3 câu hỏi trắc nghiệm trước khi nộp bài!");
    return;
  }

  // Calculate score and show feedback
  QUIZ_QUESTIONS.forEach((q, qIdx) => {
    const selectedIdx = userAnswers[qIdx];
    const isCorrect = (selectedIdx === q.correctIndex);
    if (isCorrect) score++;

    // Highlight options
    q.options.forEach((optText, optIdx) => {
      const label = document.getElementById(`q-label-${q.id}-${optIdx}`);
      const radio = label.querySelector('input');
      radio.disabled = true; // lock input

      if (optIdx === q.correctIndex) {
        // Mark correct answer in green
        label.classList.remove('selected');
        label.classList.add('correct');
      } else if (optIdx === selectedIdx) {
        // Mark wrong choice in red
        label.classList.remove('selected');
        label.classList.add('incorrect');
      } else {
        // Reset others
        label.classList.remove('selected');
      }
    });

    // Reveal explanation box
    document.getElementById(`q-exp-${q.id}`).classList.remove('hidden');
  });

  // Display Score
  const scoreBox = document.getElementById('quiz-score');
  scoreBox.innerText = `KẾT QUẢ TRẮC NGHIỆM: ĐÚNG ${score}/${QUIZ_QUESTIONS.length} CÂU (${Math.round((score/QUIZ_QUESTIONS.length)*100)}%)`;
  scoreBox.classList.remove('hidden');
  
  // Disable check button
  const checkBtn = document.getElementById('btn-check-quiz');
  checkBtn.disabled = true;
  checkBtn.innerText = '✓ Đã hoàn thành bài trắc nghiệm';
  
  // Record score to gameState
  gameState.quizScore = score;
  gameState.quizAnswers = userAnswers;
  
  showToast(`🎯 Bạn đã trả lời đúng ${score}/3 câu trắc nghiệm!`);
}

// Export learning records to local text/Markdown file
function exportData() {
  let scoreText = "Chưa làm bài trắc nghiệm";
  if (gameState.quizScore !== undefined) {
    scoreText = `Đúng ${gameState.quizScore}/3 câu`;
  }

  let report = `# BÁO CÁO HỌC TẬP: ĐẾ CHẾ ĐỘC QUYỀN\n`;
  report += `Ngành công nghiệp mô phỏng: ${gameState.industry.toUpperCase()}\n`;
  report += `Vị thế độc quyền cuối cùng: ${INTEGRATION_LABELS[gameState.integrationLevel]}\n`;
  report += `Quy mô liên kết: ${gameState.scope}\n`;
  report += `Vốn tích tụ cuối cùng: $${gameState.capital.toLocaleString()}k\n`;
  report += `Kết quả trắc nghiệm ôn tập: ${scoreText}\n`;
  report += `=========================================\n\n`;
  
  report += `## LỊCH SỬ QUYẾT ĐỊNH (ROUND-BY-ROUND):\n`;
  gameState.history.forEach(h => {
    report += `Vòng ${h.round}: ${h.scenarioTitle}\n`;
    report += `- Bạn đã chọn: Lựa chọn [${h.choiceId}] - "${h.choiceText}"\n`;
    report += `- Khái niệm giáo trình: ${h.theory}\n`;
    report += `- Tác động kinh tế: ${h.detail}\n`;
    report += `-----------------------------------------\n`;
  });

  if (gameState.quizAnswers) {
    report += `\n## ĐÁNH GIÁ TRẮC NGHIỆM CHI TIẾT:\n`;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      const userAnsIdx = gameState.quizAnswers[idx];
      const userAnsText = userAnsIdx !== -1 ? q.options[userAnsIdx] : "Chưa chọn";
      const correctText = q.options[q.correctIndex];
      const status = userAnsIdx === q.correctIndex ? "ĐÚNG" : "SAI";
      
      report += `${q.question}\n`;
      report += `- Câu trả lời của bạn: "${userAnsText}" -> [${status}]\n`;
      report += `- Đáp án chuẩn: "${correctText}"\n`;
      report += `- Giải thích lý thuyết: ${q.explanation}\n`;
      report += `-----------------------------------------\n`;
    });
  }

  // Create file download link
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Cao_Doc_Quyen_mln122_${gameState.industry}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("💾 Đã tải báo cáo học tập (.txt) về máy!");
}

// Replay Game action
function replayGame() {
  if (confirm("Bạn có muốn chơi lại từ đầu không? Lịch sử chơi hiện tại sẽ bị xóa.")) {
    document.getElementById('screen-end').classList.add('hidden');
    document.getElementById('screen-welcome').classList.remove('hidden');
    
    // Reset quiz state
    delete gameState.quizScore;
    delete gameState.quizAnswers;
  }
}
