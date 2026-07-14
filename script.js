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

  // Initialize quiz for this session by picking 10 random questions
  gameState.activeQuizQuestions = getRandomQuizQuestions();
  gameState.currentQuizIndex = 0;
  gameState.quizAnswers = [];
  gameState.quizSubmitted = false;

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
    question: "Câu 1. Cạnh tranh trong chủ nghĩa tư bản dẫn đến:",
    options: [
      "A. Tích lũy tư bản",
      "B. Tích tụ tư bản",
      "C. Độc quyền"
    ],
    correctIndex: 2,
    explanation: "Theo V.I. Lênin, cạnh tranh tự do thúc đẩy tích tụ và tập trung sản xuất, khi sự tích tụ này đạt đến một mức độ nhất định sẽ tất yếu dẫn đến độc quyền."
  },
  {
    id: 2,
    question: "Câu 2. Đâu là một trong những nguyên nhân dẫn đến độc quyền?",
    options: [
      "A. Do cạnh tranh",
      "B. Do việc bóc lột sức lao động",
      "C. Do sự vận dụng từ các học thuyết kinh tế vào kinh doanh",
      "D. Do sự ra đời của nhà nước"
    ],
    correctIndex: 0,
    explanation: "Cạnh tranh tàn khốc buộc các xí nghiệp lớn phải thỏa hiệp, liên minh với nhau để tránh sự tự hủy diệt, từ đó hình thành các tổ chức độc quyền."
  },
  {
    id: 3,
    question: "Câu 3. Sự hình thành độc quyền dựa trên các nguyên nhân nào sau đây?",
    options: [
      "A. Sự phát triển của lực lượng sản xuất thúc đẩy các tổ chức độc quyền; cạnh tranh; khủng hoảng; sự phát triển của hệ thống tín dụng",
      "B. Sự phát triển của quan hệ sản xuất thúc đẩy các tổ chức độc quyền; cạnh tranh; khủng hoảng; sự phát triển của hệ thống tín dụng",
      "C. Sự phát triển của phương thức sản xuất tư bản chủ nghĩa thúc đẩy các tổ chức độc quyền; cạnh tranh; khủng hoảng sự phát triển của hệ thống tín dụng",
      "D. Sự phát triển của lực lượng sản xuất thúc đẩy các tổ chức độc quyền; cạnh tranh; khủng hoảng trong sự phát triển của một quốc gia"
    ],
    correctIndex: 0,
    explanation: "4 nguyên nhân cốt lõi hình thành độc quyền là: Sự phát triển lực lượng sản xuất quy mô lớn; Cạnh tranh khốc liệt giữa các xí nghiệp lớn; Khủng hoảng kinh tế đào thải kẻ yếu; Sự phát triển của hệ thống tín dụng và ngân hàng hỗ trợ tập trung tư bản."
  },
  {
    id: 4,
    question: "Câu 4. Sự hình thành các tổ chức độc quyền dựa trên cơ sở nào?",
    options: [
      "A. Tích tụ tập trung sản xuất và sự ra đời của các xí nghiệp quy mô lớn",
      "B. Sự xuất hiện các thành tựu mới của khoa học",
      "C. Sản xuất nhỏ phân tán",
      "D. Nhiều doanh nghiệp vừa và nhỏ ra đời"
    ],
    correctIndex: 0,
    explanation: "Độc quyền hình thành trực tiếp dựa trên trình độ tích tụ và tập trung sản xuất cao độ dẫn đến sự thống trị của các xí nghiệp quy mô khổng lồ."
  },
  {
    id: 5,
    question: "Câu 5. Các tổ chức độc quyền hình thành trên cơ sở:",
    options: [
      "A. Liên kết dọc và liên kết ngang",
      "B. Liên kết tự giác và liên kết tự phát",
      "C. Liên kết bên ngoài và liên kết bên trong"
    ],
    correctIndex: 0,
    explanation: "Các tổ chức độc quyền tích lũy quy mô bằng cả hai hình thức: liên kết ngang (cùng một ngành sản xuất) và liên kết dọc (đa ngành dọc theo chuỗi cung ứng nguyên liệu đến thành phẩm)."
  },
  {
    id: 6,
    question: "Câu 6. Liên kết các doanh nghiệp theo cùng một ngành là theo hình thức:",
    options: [
      "A. Liên kết dọc",
      "B. Liên kết ngang",
      "C. Cả liên kết dọc và liên kết ngang",
      "D. Một liên kết khác"
    ],
    correctIndex: 1,
    explanation: "Liên kết các doanh nghiệp có cùng quy trình sản xuất và sản phẩm trong cùng một ngành được gọi là liên kết ngang."
  },
  {
    id: 7,
    question: "Câu 7. Về mặt lịch sử, các hình thức tổ chức độc quyền cơ bản từ thấp đến cao đó là:",
    options: [
      "A. Cartel – Syndicate – Trust – Consortium",
      "B. Cartel – Trust – Syndicate – Consortium",
      "C. Trust – Cartel – Syndicate – Consortium",
      "D. Trust – Syndicate – Cartel – Consortium"
    ],
    correctIndex: 0,
    explanation: "Các hình thức tổ chức độc quyền cơ bản phát triển từ thấp đến cao theo trình tự thời gian và độ chặt chẽ là: Cartel (Sơ khai) -> Syndicate -> Trust -> Consortium (Hình thức cao nhất)."
  },
  {
    id: 8,
    question: "Câu 8. Nhận định nào sau đây là sai?",
    options: [
      "A. Consortium là hình thức độc quyền theo liên kết dọc",
      "B. Các tổ chức độc quyền mở rộng ra nhiều ngành khác nhau là phát triển theo liên kết dọc",
      "C. Các nhà tư bản tham gia Cartel vẫn độc lập về sản xuất nhưng mất độc lập về lưu thông",
      "D. Trust là tổ chức độc quyền cao hơn Syndicate"
    ],
    correctIndex: 2,
    explanation: "Nhận định C là sai vì các thành viên tham gia Cartel vẫn độc lập hoàn toàn cả về sản xuất lẫn lưu thông thương mại. Syndicate mới là hình thức mất độc lập về khâu lưu thông."
  },
  {
    id: 9,
    question: "Câu 9. Hình thức độc quyền nào thấp nhất trong các hình thức sau?",
    options: [
      "A. Cartel",
      "B. Syndicate",
      "C. Trust",
      "D. Consortium"
    ],
    correctIndex: 0,
    explanation: "Cartel là hình thức độc quyền thấp nhất và lỏng lẻo nhất, các xí nghiệp chỉ thỏa ước về giá và sản lượng nhưng hoàn toàn độc lập về mọi mặt."
  },
  {
    id: 10,
    question: "Câu 10. Hình thức độc quyền nào cao nhất trong các hình thức sau?",
    options: [
      "A. Cartel",
      "B. Syndicate",
      "C. Trust",
      "D. Consortium"
    ],
    correctIndex: 3,
    explanation: "Consortium là hình thức độc quyền cao nhất, đa ngành, quy mô khổng lồ và có sự tham gia thắt chặt của các siêu tổ chức tài chính ngân hàng."
  },
  {
    id: 11,
    question: "Câu 11. Khi các xí nghiệp tham gia chỉ mất độc quyền về lưu thông (vẫn độc lập sản xuất) là hình thức độc quyền nào?",
    options: [
      "A. Cartel",
      "B. Syndicate",
      "C. Trust",
      "D. Consortium"
    ],
    correctIndex: 1,
    explanation: "Đặc trưng cốt lõi của Syndicate là các doanh nghiệp thành viên mất tính độc lập thương mại lưu thông (mua bán chung), nhưng vẫn giữ nguyên tính độc lập về sản xuất."
  },
  {
    id: 12,
    question: "Câu 12. Hình thức độc quyền nào thống nhất việc sản xuất, tiêu thụ, tài vụ đều do một ban quản trị quản lý?",
    options: [
      "A. Consortium",
      "B. Syndicate",
      "C. Cartel",
      "D. Trust"
    ],
    correctIndex: 3,
    explanation: "Trong Trust, các xí nghiệp thành viên mất hoàn toàn tính độc lập sản xuất lẫn lưu thông. Ban quản lý ủy thác chung điều phối mọi hoạt động, chủ xí nghiệp cũ chỉ nhận cổ tức theo cổ phiếu."
  },
  {
    id: 13,
    question: 'Câu 13. "Tư bản tài chính là kết quả của sự hợp nhất giữa tư bản ngân hàng của một số ít ngân hàng độc quyền lớn nhất, với tư bản của những liên minh độc quyền các nhà công nghiệp." Câu nói trên của ai?',
    options: [
      "A. C. Mác",
      "B. Ph. Ăngghen",
      "C. V.I. Lênin",
      "D. Hồ Chí Minh"
    ],
    correctIndex: 2,
    explanation: "Đây là định nghĩa kinh điển của V.I. Lênin về bản chất kinh tế của Tư bản tài chính trong chủ nghĩa tư bản giai đoạn độc quyền."
  },
  {
    id: 14,
    question: "Câu 14. Tư bản tài chính có nguồn gốc từ đâu?",
    options: [
      "A. Quá trình độc quyền hoá trong thương nghiệp và ngân hàng",
      "B. Quá trình độc quyền hoá trong công nghiệp và ngân hàng",
      "C. Quá trình độc quyền hoá trong thương nghiệp và công nghiệp",
      "D. Quá trình độc quyền hoá trong công – nông – thương"
    ],
    correctIndex: 1,
    explanation: "Tư bản tài chính hình thành từ sự dung hợp, xâm nhập lẫn nhau giữa độc quyền công nghiệp và độc quyền ngân hàng."
  },
  {
    id: 15,
    question: "Câu 15. Trong chủ nghĩa tư bản ngày nay, các trùm tài chính thống trị nền kinh tế thông qua:",
    options: [
      'A. Kết hợp "chế độ tham dự" với "chế độ uỷ nhiệm"',
      "B. Chế độ tham dự",
      "C. Chế độ uỷ nhiệm"
    ],
    correctIndex: 0,
    explanation: "Bọn đầu sỏ tài chính củng cố quyền lực bằng cách kết hợp Chế độ tham dự (mua cổ phần khống chế công ty mẹ, kiểm soát gián tiếp các công ty con) và Chế độ ủy nhiệm (nhận ủy thác quản lý tài chính)."
  },
  {
    id: 16,
    question: "Câu 16. Sự phát triển của tư bản tài chính dẫn đến sự hình thành của:",
    options: [
      "A. Các nhà tài phiệt",
      "B. Các tập đoàn tài chính",
      "C. Các doanh nghiệp tư nhân",
      "D. Các công ty mẹ"
    ],
    correctIndex: 0,
    explanation: "Tư bản tài chính tập trung tạo nên một tầng lớp thiểu số thống trị có quyền lực kinh tế và chính trị cực lớn, được gọi là các nhà tài phiệt (bọn đầu sỏ tài chính)."
  },
  {
    id: 17,
    question: "Câu 17. Sự phát triển của các tổ chức độc quyền trong ngân hàng đã làm thay đổi quan hệ giữa ngân hàng và các doanh nghiệp công nghiệp đó là:",
    options: [
      "A. Từ trung gian thanh toán trở thành khống chế mọi hoạt động kinh tế – xã hội",
      "B. Từ trung gian thanh toán trở thành cổ đông của các doanh nghiệp nhà nước",
      "C. Từ hoạt động cho vay trở thành hoạt động khống chế doanh nghiệp tư nhân",
      "D. Từ hoạt động cho vay trở thành chi phối các doanh nghiệp"
    ],
    correctIndex: 0,
    explanation: "Ngân hàng không còn là thủ quỹ thanh toán đơn thuần mà trở thành người giám sát, khống chế, nắm giữ vận mệnh kinh tế của các xí nghiệp công nghiệp."
  },
  {
    id: 18,
    question: "Câu 18. Xuất khẩu tư bản là gì?",
    options: [
      "A. Đặc điểm của chủ nghĩa tư bản tự do cạnh tranh",
      "B. Mang tư bản đầu tư ở nước ngoài để sản xuất giá trị thặng dư tại nước sở tại",
      "C. Mang hàng hóa ra nước ngoài để thực hiện giá trị của hàng hóa",
      "D. Mang tư bản ra nước ngoài mua nguyên nhiên vật liệu sản xuất"
    ],
    correctIndex: 1,
    explanation: "Xuất khẩu tư bản là đưa vốn (tiền mặt, máy móc...) ra nước ngoài để đầu tư sản xuất trực tiếp hoặc cho vay, nhằm khai thác nhân công, tài nguyên giá rẻ để tạo ra giá trị thặng dư ngay tại nước nhập khẩu vốn."
  },
  {
    id: 19,
    question: "Câu 19. Xuất khẩu tư bản được coi là đặc điểm của:",
    options: [
      "A. Phương thức sản xuất phong kiến",
      "B. Phương thức sản xuất tư bản chủ nghĩa",
      "C. Chủ nghĩa tư bản giai đoạn tự do cạnh tranh",
      "D. Chủ nghĩa tư bản giai đoạn độc quyền"
    ],
    correctIndex: 3,
    explanation: "Xuất khẩu hàng hóa là đặc điểm của giai đoạn tự do cạnh tranh, còn xuất khẩu tư bản là đặc trưng kinh tế nổi bật của giai đoạn tư bản độc quyền."
  },
  {
    id: 20,
    question: "Câu 20. Trên giác độ kinh tế chính trị, mục tiêu cuối cùng của xuất khẩu tư bản là:",
    options: [
      "A. Chiếm đoạt giá trị thặng dư và các nguồn lợi khác ở nước nhập khẩu tư bản",
      "B. Thực hiện giá trị và chiếm các nguồn lợi khác của nước nhập khẩu tư bản",
      "C. Giúp đỡ các nước nhập khẩu tư bản phát triển"
    ],
    correctIndex: 0,
    explanation: "Mục đích kinh tế tối cao của xuất khẩu tư bản là thu hồi siêu lợi nhuận độc quyền từ việc bóc lột sức lao động và vơ vét tài nguyên nước sở tại."
  },
  {
    id: 21,
    question: "Câu 21. Trong xuất khẩu tư bản, có hai hình thức đầu tư đó là:",
    options: [
      "A. Đầu tư trực tiếp và đầu tư gián tiếp",
      "B. Đầu tư trực tiếp và đầu tư uỷ nhiệm",
      "C. Đầu tư trực tiếp và đầu tư nhà nước",
      "D. Đầu tư tư bản tư nhân và đầu tư tư bản nhà nước"
    ],
    correctIndex: 0,
    explanation: "Hai hình thức cơ bản của xuất khẩu tư bản phân theo phương thức quản trị vốn là: Đầu tư trực tiếp (FDI) và Đầu tư gián tiếp (mua cổ phiếu, cho vay lãi)."
  },
  {
    id: 22,
    question: "Câu 22. Mua cổ phiếu, trái phiếu là hình thức đầu tư gì?",
    options: [
      "A. Đầu tư gián tiếp",
      "B. Đầu tư trực tiếp",
      "C. Đầu tư thị trường",
      "D. Đầu tư tiền tệ"
    ],
    correctIndex: 0,
    explanation: "Mua chứng khoán nước ngoài để lấy cổ tức hoặc lãi mà không trực tiếp đứng ra xây dựng, điều hành dự án sản xuất là đầu tư gián tiếp."
  },
  {
    id: 23,
    question: "Câu 23. Biểu hiện mới của xuất khẩu tư bản ngày nay đó là:",
    options: [
      "A. Dòng đầu tư chảy qua lại giữa các nước tư bản phát triển với nhau",
      "B. Vai trò của các công ty xuyên quốc gia trong xuất khẩu tư bản — đặc biệt đầu tư trực tiếp nước ngoài (FDI) càng lớn",
      "C. Hình thức xuất khẩu đa dạng",
      "D. Dựa trên nguyên tắc cùng có lợi",
      "E. Tất cả phương án trên"
    ],
    correctIndex: 4,
    explanation: "Trong giai đoạn hiện nay, xuất khẩu tư bản xuất hiện nhiều biểu hiện mới phong phú, bao gồm sự gia tăng của FDI từ các công ty đa quốc gia (TNCs), sự đầu tư chéo giữa các nước phát triển, và sự đa dạng hóa hình thức trên cơ sở đôi bên cùng có lợi."
  },
  {
    id: 24,
    question: "Câu 24. Các tổ chức độc quyền của các quốc gia cạnh tranh với nhau trên thị trường quốc tế sẽ dẫn đến:",
    options: [
      "A. Sự thôn tính nhau",
      "B. Sẽ có các tổ chức độc quyền bị phá sản, còn những tổ chức độc quyền mạnh tồn tại",
      "C. Đấu tranh không khoan nhượng",
      "D. Thỏa hiệp với nhau để hình thành các tổ chức độc quyền quốc tế"
    ],
    correctIndex: 3,
    explanation: "Khi cuộc cạnh tranh quốc tế quá khốc liệt, các tập đoàn xuyên quốc gia có xu hướng ký thỏa ước để phân chia thị trường thế giới nhằm độc chiếm các vùng kinh tế, tạo ra liên minh độc quyền quốc tế."
  },
  {
    id: 25,
    question: "Câu 25. Kết quả cạnh tranh giữa các tổ chức độc quyền trong cùng một ngành:",
    options: [
      "A. Một sự thỏa hiệp được hình thành",
      "B. Một bên phá sản",
      "C. Một sự thỏa hiệp được hình thành hoặc một bên phá sản",
      "D. Cả hai cùng lớn mạnh"
    ],
    correctIndex: 2,
    explanation: "Cạnh tranh khốc liệt giữa các ông lớn công nghiệp cùng ngành trên thế giới tất yếu dẫn đến thỏa hiệp chia chác thị trường, hoặc một bên kiệt quệ và bị nuốt chửng."
  },
  {
    id: 26,
    question: "Câu 26. Sau những năm 50 của thế kỷ XX, chủ nghĩa tư bản chuyển sang chính sách thực dân mới đó là:",
    options: [
      "A. Viện trợ kinh tế",
      "B. Viện trợ quân sự",
      "C. Viện trợ thuốc men",
      "D. Viện trợ chính trị"
    ],
    isMultipleChoice: true,
    correctIndices: [0, 1],
    explanation: "Thời kỳ thực dân mới, các cường quốc áp đặt sự chi phối bằng cách kết hợp giữa viện trợ kinh tế đi kèm điều kiện ràng buộc tài chính và viện trợ quân sự để kiểm soát an ninh quốc phòng."
  },
  {
    id: 27,
    question: "Câu 27. Chính sách thực dân trong thời đại chủ nghĩa đế quốc tư bản đã tạo ra những hình thức lệ thuộc mới có tính quá độ của các nước đó là:",
    options: [
      "A. Độc lập về chính trị nhưng lệ thuộc về kinh tế và ngoại giao",
      "B. Độc lập về kinh tế nhưng lệ thuộc về chính trị",
      "C. Lệ thuộc về kinh tế, chính trị và ngoại giao",
      "D. Độc lập về lãnh thổ, nhưng lệ thuộc về ngoại giao"
    ],
    correctIndex: 0,
    explanation: "Chủ nghĩa thực dân mới cho phép nước nhỏ độc lập về mặt chính quyền hành chính chính trị bên ngoài, nhưng khống chế toàn diện về mạch máu kinh tế và đường lối ngoại giao."
  },
  {
    id: 28,
    question: "Câu 28. Tổng kết thực tiễn vai trò của độc quyền trong nền kinh tế các nước tư bản phát triển giai đoạn cuối thế kỷ XIX đầu thế kỷ XX, V.I. Lênin đã khái quát độc quyền tư bản chủ nghĩa thành:",
    options: [
      "A. Bốn đặc điểm",
      "B. Năm đặc điểm",
      "C. Sáu đặc điểm",
      "D. Bảy đặc điểm"
    ],
    correctIndex: 1,
    explanation: "Lênin đã tóm tắt và phân tích sâu sắc hệ thống độc quyền qua 5 đặc điểm kinh tế cơ bản nhất của chủ nghĩa đế quốc."
  },
  {
    id: 29,
    question: "Câu 29. Những đặc điểm kinh tế cơ bản nhất của chủ nghĩa tư bản độc quyền bao gồm:",
    options: [
      "A. Tập trung sản xuất cùng với các tổ chức độc quyền; tư bản tài chính; xuất khẩu tư bản; sự phân chia thế giới về lãnh thổ giữa các nước đế quốc",
      "B. Tập trung sản xuất cùng với các tổ chức độc quyền, tư bản tài chính; sự phân chia thị trường thế giới giữa các tổ chức độc quyền, sự phân chia thế giới về lãnh thổ giữa các nước đế quốc",
      "C. Tập trung sản xuất cùng với các tổ chức độc quyền; xuất khẩu tư bản; sự phân chia thị trường thế giới giữa các tổ chức độc quyền; sự phân chia thế giới về lãnh thổ giữa các nước đế quốc",
      "D. Tập trung sản xuất cùng với các tổ chức độc quyền; tư bản tài chính; xuất khẩu tư bản; sự phân chia thị trường thế giới giữa các tổ chức độc quyền; sự phân chia thế giới về lãnh thổ giữa các nước đế quốc"
    ],
    correctIndex: 3,
    explanation: "Đây là tập hợp đầy đủ 5 đặc trưng kinh tế cơ bản của chủ nghĩa tư bản giai đoạn độc quyền."
  },
  {
    id: 30,
    question: "Câu 30. V.I. Lênin đã phân tích chủ nghĩa tư bản độc quyền bằng các đặc điểm kinh tế cơ bản nào sau đây:",
    options: [
      "A. Tập trung sản xuất và các tổ chức độc quyền; tư bản tài chính và bọn đầu sỏ tài chính",
      "B. Tập trung sản xuất và các tổ chức độc quyền; tư bản tài chính và bọn đầu sỏ tài chính; xuất khẩu tư bản",
      "C. Tập trung sản xuất và các tổ chức độc quyền, tư bản tài chính và bọn đầu sỏ tài chính; xuất khẩu tư bản; phân chia thế giới về kinh tế",
      "D. Tập trung sản xuất và các tổ chức độc quyền, tư bản tài chính và bọn đầu sỏ tài chính; xuất khẩu tư bản; phân chia thế giới về kinh tế giữa các tổ chức độc quyền; sự phân chia thế giới về lãnh thổ giữa các cường quốc đế quốc"
    ],
    correctIndex: 3,
    explanation: "Độc quyền gồm 5 đặc điểm cơ bản: (1) Tích tụ sản xuất & độc quyền, (2) Tư bản tài chính & tài phiệt, (3) Xuất khẩu tư bản, (4) Phân chia thế giới về kinh tế, (5) Phân chia thế giới về lãnh thổ."
  }
];

// Helper to shuffle questions and pick 10 random ones
function getRandomQuizQuestions() {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
}

// Render dynamic quiz content (one question at a time)
function renderQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  if (gameState.currentQuizIndex === undefined) {
    gameState.currentQuizIndex = 0;
  }
  if (!gameState.quizAnswers) {
    gameState.quizAnswers = [];
  }

  // Ensure export/print buttons are hidden while quiz is in progress
  document.getElementById('btn-export-data').classList.add('hidden');
  document.getElementById('btn-print-data').classList.add('hidden');
  document.getElementById('quiz-unlock-note').classList.remove('hidden');

  const qIdx = gameState.currentQuizIndex;
  
  // If we've completed all questions (index >= activeQuizQuestions.length), show final overview
  if (gameState.activeQuizQuestions && qIdx >= gameState.activeQuizQuestions.length) {
    showQuizResultsSummary();
    return;
  }

  const q = gameState.activeQuizQuestions[qIdx];

  const card = document.createElement('div');
  card.className = 'quiz-question-card';
  card.style.animation = 'fadeIn 0.4s ease-out';

  // Question indicator (e.g. Câu hỏi 1/10)
  const qIndicator = document.createElement('div');
  qIndicator.style.fontSize = '0.8rem';
  qIndicator.style.color = 'var(--color-border-gold)';
  qIndicator.style.textTransform = 'uppercase';
  qIndicator.style.fontWeight = '700';
  qIndicator.style.marginBottom = '5px';
  qIndicator.innerText = `Câu hỏi ${qIdx + 1} / ${gameState.activeQuizQuestions.length}`;
  card.appendChild(qIndicator);

  const qTitle = document.createElement('div');
  qTitle.style.fontWeight = '600';
  qTitle.style.fontSize = '1.05rem';
  qTitle.style.color = '#ebdcb2';
  qTitle.style.marginBottom = '12px';
  qTitle.innerText = q.question.replace(/^Câu \d+\.\s*/, ''); // strip prefix if duplicate
  if (q.isMultipleChoice) {
    qTitle.innerText += ' (Chọn nhiều đáp án)';
  }
  card.appendChild(qTitle);

  const optionsList = document.createElement('div');
  optionsList.className = 'quiz-options-list';

  q.options.forEach((optText, optIdx) => {
    const label = document.createElement('label');
    label.className = 'quiz-option-label';
    label.id = `q-label-${q.id}-${optIdx}`;

    const input = document.createElement('input');
    input.type = q.isMultipleChoice ? 'checkbox' : 'radio';
    input.name = `quiz-q-${q.id}`;
    input.value = optIdx;
    
    // If already submitted this round, disable input and style
    if (gameState.quizSubmitted) {
      input.disabled = true;
      
      const userSelectedAnswers = gameState.quizAnswers[qIdx] || [];
      const userHasSelected = q.isMultipleChoice 
        ? userSelectedAnswers.includes(optIdx) 
        : (gameState.quizAnswers[qIdx] === optIdx);
        
      const isCorrectOption = q.isMultipleChoice 
        ? q.correctIndices.includes(optIdx) 
        : (optIdx === q.correctIndex);

      if (isCorrectOption) {
        label.className = 'quiz-option-label correct';
        input.checked = userHasSelected || isCorrectOption;
      } else if (userHasSelected) {
        label.className = 'quiz-option-label incorrect';
        input.checked = true;
      }
    } else {
      // Restore previous selection if any
      const prevAnswers = gameState.quizAnswers[qIdx];
      if (q.isMultipleChoice) {
        if (Array.isArray(prevAnswers) && prevAnswers.includes(optIdx)) {
          label.classList.add('selected');
          input.checked = true;
        }
      } else {
        if (prevAnswers === optIdx) {
          label.classList.add('selected');
          input.checked = true;
        }
      }
      
      input.onchange = () => {
        if (q.isMultipleChoice) {
          if (input.checked) {
            label.classList.add('selected');
          } else {
            label.classList.remove('selected');
          }
          // Gather all checked indices for multiple choice
          const checked = [];
          q.options.forEach((_, idx) => {
            const optInput = optionsList.querySelector(`input[value="${idx}"]`);
            if (optInput && optInput.checked) checked.push(idx);
          });
          gameState.quizAnswers[qIdx] = checked;
        } else {
          // Single choice: clear other options
          for (let i = 0; i < q.options.length; i++) {
            const optLabel = document.getElementById(`q-label-${q.id}-${i}`);
            if (optLabel) optLabel.classList.remove('selected');
          }
          label.classList.add('selected');
          gameState.quizAnswers[qIdx] = optIdx;
        }
      };
    }

    const span = document.createElement('span');
    span.innerText = optText;

    label.appendChild(input);
    label.appendChild(span);
    optionsList.appendChild(label);
  });
  card.appendChild(optionsList);

  // Explanation Box
  const expBox = document.createElement('div');
  expBox.className = `quiz-explanation-box ${gameState.quizSubmitted ? '' : 'hidden'}`;
  expBox.id = `q-exp-${q.id}`;
  expBox.innerHTML = `<strong>Giải thích kinh tế học:</strong> ${q.explanation}`;
  card.appendChild(expBox);

  container.appendChild(card);

  // Configure action button
  const checkBtn = document.getElementById('btn-check-quiz');
  checkBtn.classList.remove('hidden');
  checkBtn.disabled = false;
  
  if (!gameState.quizSubmitted) {
    checkBtn.innerText = '📝 Xác nhận câu trả lời';
    checkBtn.onclick = submitActiveAnswer;
  } else {
    if (qIdx < gameState.activeQuizQuestions.length - 1) {
      checkBtn.innerText = 'Câu tiếp theo ➜';
      checkBtn.onclick = goToNextQuestion;
    } else {
      checkBtn.innerText = '📊 Xem kết quả chung ➜';
      checkBtn.onclick = finishQuiz;
    }
  }
}

// Submit active quiz question answer
function submitActiveAnswer() {
  const qIdx = gameState.currentQuizIndex;
  const q = gameState.activeQuizQuestions[qIdx];

  const inputs = document.getElementsByName(`quiz-q-${q.id}`);
  let isCorrect = false;

  if (q.isMultipleChoice) {
    const selectedIndices = [];
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) {
        selectedIndices.push(i);
      }
    }
    if (selectedIndices.length === 0) {
      alert("Vui lòng chọn ít nhất một phương án trả lời trước khi xác nhận!");
      return;
    }
    gameState.quizAnswers[qIdx] = selectedIndices;
    
    // Compare array elements
    isCorrect = (selectedIndices.length === q.correctIndices.length &&
                 selectedIndices.every(val => q.correctIndices.includes(val)));
  } else {
    let selectedIdx = -1;
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) {
        selectedIdx = i;
        break;
      }
    }
    if (selectedIdx === -1) {
      alert("Vui lòng chọn một phương án trả lời trước khi xác nhận!");
      return;
    }
    gameState.quizAnswers[qIdx] = selectedIdx;
    isCorrect = (selectedIdx === q.correctIndex);
  }

  gameState.quizSubmitted = true;

  // Re-render to show feedback (green/red highlights and explanation)
  renderQuiz();

  if (isCorrect) {
    showToast("🎯 Câu trả lời chính xác!");
  } else {
    showToast("❌ Rất tiếc, câu trả lời chưa đúng.");
  }
}

// Proceed to next quiz question
function goToNextQuestion() {
  gameState.currentQuizIndex++;
  gameState.quizSubmitted = false;
  renderQuiz();
}

// Complete the quiz
function finishQuiz() {
  gameState.currentQuizIndex++; // triggers the index check in renderQuiz() to show results
  renderQuiz();
}

// Show results summary
function showQuizResultsSummary() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  let score = 0;
  gameState.activeQuizQuestions.forEach((q, idx) => {
    const ans = gameState.quizAnswers[idx];
    if (q.isMultipleChoice) {
      const isCorrect = Array.isArray(ans) && 
                       ans.length === q.correctIndices.length &&
                       ans.every(val => q.correctIndices.includes(val));
      if (isCorrect) score++;
    } else {
      if (ans === q.correctIndex) score++;
    }
  });

  gameState.quizScore = score;

  const summaryCard = document.createElement('div');
  summaryCard.className = 'quiz-question-card';
  summaryCard.style.textAlign = 'center';
  summaryCard.style.animation = 'scaleUp 0.4s ease-out';

  const scoreTitle = document.createElement('div');
  scoreTitle.style.fontFamily = 'var(--font-title)';
  scoreTitle.style.fontSize = '1.5rem';
  scoreTitle.style.fontWeight = '800';
  scoreTitle.style.color = 'var(--color-border-gold)';
  scoreTitle.style.marginBottom = '10px';
  scoreTitle.innerText = `KẾT QUẢ TRẮC NGHIỆM: ĐÚNG ${score}/${gameState.activeQuizQuestions.length} CÂU`;
  summaryCard.appendChild(scoreTitle);

  const scorePercent = document.createElement('div');
  scorePercent.style.fontSize = '1rem';
  scorePercent.style.color = 'var(--color-text-muted)';
  scorePercent.style.marginBottom = '20px';
  scorePercent.innerText = `Tỷ lệ hoàn thành đúng: ${Math.round((score / gameState.activeQuizQuestions.length) * 100)}%`;
  summaryCard.appendChild(scorePercent);

  // Feedback text
  const feedback = document.createElement('p');
  feedback.style.fontSize = '0.95rem';
  feedback.style.lineHeight = '1.6';
  feedback.style.marginBottom = '20px';
  
  if (score === gameState.activeQuizQuestions.length) {
    feedback.innerText = "🏆 Tuyệt vời! Bạn đạt điểm số tối đa. Bạn đã nắm rất vững toàn bộ 5 đặc điểm kinh tế của độc quyền theo lý luận của V.I. Lênin!";
  } else if (score >= 7) {
    feedback.innerText = "✨ Rất tốt! Bạn đã vượt qua bài kiểm tra trắc nghiệm với điểm số cao. Hãy tiếp tục phát huy và xem kỹ lại các câu trả lời sai nhé.";
  } else if (score >= 5) {
    feedback.innerText = "📚 Khá ổn! Bạn đạt mức trung bình khá. Có một số khái niệm vẫn cần làm rõ hơn, hãy rê chuột vào các Node trong sơ đồ cây quyết định để ôn lại.";
  } else {
    feedback.innerText = "⚠️ Điểm số dưới trung bình. Bạn cần ôn tập kỹ lại lý thuyết. Hãy nhấn nút xem lại chi tiết từng câu bên dưới hoặc rê chuột xem các bài học trên cây quyết định.";
  }
  summaryCard.appendChild(feedback);

  // Review button
  const reviewBtn = document.createElement('button');
  reviewBtn.className = 'btn';
  reviewBtn.style.padding = '8px 16px';
  reviewBtn.innerText = '🔍 Xem lại chi tiết 10 câu hỏi';
  reviewBtn.onclick = () => {
    gameState.currentQuizIndex = 0;
    gameState.quizSubmitted = true;
    renderQuiz();
  };
  summaryCard.appendChild(reviewBtn);

  container.appendChild(summaryCard);

  // Hide check button
  const checkBtn = document.getElementById('btn-check-quiz');
  checkBtn.classList.add('hidden');

  // Unlock final action buttons
  document.getElementById('btn-export-data').classList.remove('hidden');
  document.getElementById('btn-print-data').classList.remove('hidden');
  document.getElementById('quiz-unlock-note').classList.add('hidden');
}

// Export learning records to local text/Markdown file
function exportData() {
  let scoreText = "Chưa làm bài trắc nghiệm";
  if (gameState.quizScore !== undefined) {
    scoreText = `Đúng ${gameState.quizScore}/${gameState.activeQuizQuestions.length} câu`;
  }

  let report = `# BÁO CÁO HỌC TẬP: ĐẾ CHẾ ĐỘC QUYỀN\n`;
  report += `Ngành công nghiệp mô phỏng: ${gameState.industry.toUpperCase()}\n`;
  report += `Vị thế độc quyền cuối cùng: ${INTEGRATION_LABELS[gameState.integrationLevel]}\n`;
  report += `Quy mô liên kết: ${gameState.scope}\n`;
  report += `Vốn tích tụ cuối cùng: $${gameState.capital.toLocaleString()}k\n`;
  report += `Kết quả trắc nghiệm ôn tập ngẫu nhiên (10 câu): ${scoreText}\n`;
  report += `=========================================\n\n`;
  
  report += `## LỊCH SỬ QUYẾT ĐỊNH (ROUND-BY-ROUND):\n`;
  gameState.history.forEach(h => {
    report += `Vòng ${h.round}: ${h.scenarioTitle}\n`;
    report += `- Bạn đã chọn: Lựa chọn [${h.choiceId}] - "${h.choiceText}"\n`;
    report += `- Khái niệm giáo trình: ${h.theory}\n`;
    report += `- Tác động kinh tế: ${h.detail}\n`;
    report += `-----------------------------------------\n`;
  });

  if (gameState.quizAnswers && gameState.activeQuizQuestions) {
    report += `\n## ĐÁNH GIÁ TRẮC NGHIỆM CHI TIẾT (10 CÂU ĐÃ LÀM):\n`;
    gameState.activeQuizQuestions.forEach((q, idx) => {
      const ans = gameState.quizAnswers[idx];
      let userAnsText = "";
      let isCorrect = false;

      if (q.isMultipleChoice) {
        const indices = Array.isArray(ans) ? ans : [];
        userAnsText = indices.length > 0 
          ? indices.map(i => q.options[i]).join(" & ") 
          : "Chưa chọn";
        isCorrect = (indices.length === q.correctIndices.length &&
                     indices.every(val => q.correctIndices.includes(val)));
      } else {
        userAnsText = (ans !== undefined && ans !== -1) ? q.options[ans] : "Chưa chọn";
        isCorrect = (ans === q.correctIndex);
      }

      const correctText = q.isMultipleChoice 
        ? q.correctIndices.map(i => q.options[i]).join(" & ") 
        : q.options[q.correctIndex];
        
      const status = isCorrect ? "ĐÚNG" : "SAI";
      
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
    gameState.currentQuizIndex = 0;
    gameState.quizSubmitted = false;
    gameState.quizAnswers = [];
    delete gameState.quizScore;
    delete gameState.activeQuizQuestions;
  }
}
